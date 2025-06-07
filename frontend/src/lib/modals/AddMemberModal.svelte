<script>
    import { X, Search, Plus } from "@lucide/svelte";
    import { fade } from "svelte/transition";
    import Spinner from "../Spinner.svelte";
    import ProfileLogo from "../ProfileLogo.svelte";
    import { searchUsers } from "../../util/access-control";
    import { addUserToTeam } from "../../util/team";
    import { gravatarUrl } from "../../util/stores";

    /**
     * @param {MouseEvent | KeyboardEvent} e
     */
    const tryClose = (e) => {
        if (e instanceof KeyboardEvent && e.key != 'Escape') {
            return;
        }
        if (!addingMember) {
            close();
        }
    };

    /**
     * Add user to team
     * @param {import('common').UserWithRoles} user
     */
    const handleAddMember = async (user) => {
        addingMember = user.user.userId;
        addError = '';
        
        const result = await addUserToTeam(teamId, user.user.userId);
        console.log(result);
        if (!result) {
            addError = 'Failed to add member to team.';
        } else if ('ok' in result) {
            onMemberAdded();
            close();
        } else {
            addError = result.err.message || 'Failed to add member to team.';
        }
        
        addingMember = null;
    };

    /**
     * Get user initials for profile logo
     * @param {string} name
     * @returns {string}
     */
    const getUserInitials = (name) => {
        return name.split(' ').map(n => n.substring(0, 1).toUpperCase()).join('');
    };

    /**
     * Check if user is already a member
     * @param {import('common').User} user
     * @returns {boolean}
     */
    const isExistingMember = (user) => {
        return existingMembers.some(member => member.user_id === user.userId);
    };

    /** @type {{ 
     *   teamId: number,
     *   existingMembers: import('common').TeamMember[],
     *   close: () => void, 
     *   onMemberAdded: () => void 
     * }} */
    let { teamId, existingMembers, close, onMemberAdded } = $props();

    let search = $state('');
    let searchError = $state('');
    let addError = $state('');
    let users = $state([]);
    let usersLoading = $state(false);
    let addingMember = $state(null);

    $effect(() => {
        search.value;
        const delayedSearch = setTimeout(async () => {
            if (search.trim().length < 2) {
                users = [];
                return;
            }
            
            usersLoading = true;
            searchError = '';
            console.log("about to search")
            const result = await searchUsers(search.trim());
            if (result && 'ok' in result) {
                users = result.ok;
            } else {
                users = [];
                searchError = 'Failed to search users.';
            }
            usersLoading = false;
        }, 300);

        return () => clearTimeout(delayedSearch);
    });
</script>

<style>
    .loader-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 0 auto;
        width: 100%;
        max-width: 12rem;
        aspect-ratio: 1;
        font-size: 4rem;
    }

    .search-results {
        max-height: 20rem;
        overflow-y: auto;
        border: 1px solid #0003;
        border-radius: 0.3rem;
        background-color: white;
    }

    .user-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        border-bottom: 1px solid #0001;
        gap: 1rem;
    }

    .user-item:last-child {
        border-bottom: none;
    }

    .user-item:hover {
        background-color: #f8f8f8;
    }

    .user-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
    }

    .user-details {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .user-name {
        font-weight: 500;
        color: #333;
    }

    .user-email {
        color: #666;
        font-size: 0.875rem;
    }

    .member-badge {
        color: #666;
        font-size: 0.75rem;
        font-style: italic;
    }

    .search-state {
        padding: 2rem 1rem;
        text-align: center;
        color: #666;
    }

    .search-hint {
        padding: 1rem;
        text-align: center;
        color: #999;
        font-size: 0.875rem;
    }
</style>

<div transition:fade={{ duration: 150 }} class="modal-wrapper grey-zone" aria-hidden="true" onclick={tryClose} onkeydown={tryClose}>
    <dialog open onclick={e => e.stopPropagation()}>
        <header>
            Add Team Member
            <button class="btn btn-small" onclick={close}>
                <X class="full"/>
            </button>
        </header>
        <article>
            {#if addError}
                <p class="error">{addError}</p>
            {/if}
            <div class="inline-icon">
                <Search/>
                <label class="inline" for="search">Search Users</label>
                <input id="search" type="text" name="search" placeholder="" bind:value={search}>
            </div>
            
            {#if search.trim().length < 2}
                <div class="search-hint">
                    Enter at least 2 characters to search for users
                </div>
            {:else if usersLoading}
                <div class="search-state">
                    <Spinner/>
                </div>
            {:else if searchError}
                <div class="search-state">
                    <p class="error">{searchError}</p>
                </div>
            {:else if users.length === 0}
                <div class="search-state">
                    No users found matching "{search}"
                </div>
            {:else}
                <div class="search-results">
                    {#each users as user (user.user.userId)}
                        <div class="user-item">
                            <div class="user-info">
                                <ProfileLogo 
                                    logoSrc={gravatarUrl(user.user.email)} 
                                    initials={getUserInitials(user.user.name)}
                                />
                                <div class="user-details">
                                    <div class="user-name">{user.user.name}</div>
                                    <div class="user-email">{user.user.email}</div>
                                </div>
                            </div>
                            <div>
                                {#if isExistingMember(user.user)}
                                    <span class="member-badge">Already a member</span>
                                {:else if addingMember === user.user.userId}
                                    <button class="btn btn-small btn-primary" disabled>
                                        <Spinner/>
                                    </button>
                                {:else}
                                    <button 
                                        class="btn btn-small btn-primary" 
                                        onclick={() => handleAddMember(user)}
                                        title="Add to team"
                                    >
                                        <Plus/>
                                    </button>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </article>
    </dialog>
</div>