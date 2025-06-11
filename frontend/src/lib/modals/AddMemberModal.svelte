<script>
    import { X, Search, Plus } from "@lucide/svelte";
    import { fade } from "svelte/transition";
    import Spinner from "../Spinner.svelte";
    import ProfileLogo from "../ProfileLogo.svelte";
    import { searchUsers, timeoutPromise } from "../../util/access-control";
    import { addUserToTeam } from "../../util/team";

    const tryClose = () => {
        if (!addingMember) {
            close();
        }
    };

    /** @type {{ 
     *   teamId: number,
     *   existingMembers: import('common').PublicUser[],
     *   close: () => void, 
     *   onMemberAdded: () => void 
     * }} */
    let { teamId, existingMembers, close, onMemberAdded } = $props();

    let search = $state('');
    let users = $derived(search.trim().length >= 2 ? timeoutPromise(300).then(() => searchUsers(search.trim())) : null);
    /** @type {number | null} */
    let addingMember = $state(null);
    let addError = $state('');

    /**
     * Add user to team
     * @param {import('common').PublicUser} user
     */
    const handleAddMember = async (user) => {
        addingMember = user.userId;
        addError = '';

        try {
            const result = await addUserToTeam(teamId, user.userId);
            onMemberAdded();
            close();
        } catch (err) {
            addError = err.message ?? 'Failed to add member to team.';
        }
        
        addingMember = null;
    };

    /**
     * Check if user is already a member
     * @param {import('common').PublicUser} user
     */
    const isExistingMember = (user) => {
        return existingMembers.some(member => member.userId === user.userId);
    };
</script>

<style>
    dialog {
        position: absolute;
        border: none;

        background-color: #fafafa;
        box-shadow: 0 0.5rem 0.5rem #0001;
        position: absolute;
        z-index: 30;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        border-radius: 1rem;
        gap: 1.5rem;

        width: 100%;
        max-width: 28rem;
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

<div transition:fade={{ duration: 150 }} class="modal-wrapper grey-zone" aria-hidden="true" onclick={tryClose}>
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

            {#if users}
                {#await users}
                    <div class="search-state">
                        <Spinner/>
                    </div>
                {:then users}
                    {#if users.length === 0}
                        <div class="search-state">
                            No users found matching "{search}"
                        </div>
                    {:else}
                        <div class="search-results">
                            {#each users as user (user.userId)}
                                <div class="user-item">
                                    <div class="user-info">
                                        <ProfileLogo 
                                            userId={user.userId}
                                            name={user.name}
                                        />
                                        <div class="user-details">
                                            <div class="user-name">{user.name}</div>
                                        </div>
                                    </div>
                                    <div>
                                        {#if isExistingMember(user)}
                                            <span class="member-badge">Already a member</span>
                                        {:else if addingMember === user.userId}
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
                {:catch error}
                    <div class="search-state">
                        <p class="error">{error}</p>
                    </div>
                {/await}
            {:else}
                <div class="search-hint">
                    Enter at least 2 characters to search for users
                </div>
            {/if}
        </article>
    </dialog>
</div>