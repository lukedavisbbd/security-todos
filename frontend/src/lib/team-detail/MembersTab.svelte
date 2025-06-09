<script>
    import { Plus, UserMinus } from "@lucide/svelte";
    import { getTeamMembers, removeUserFromTeam } from "../../util/team";
    import ProfileLogo from "../ProfileLogo.svelte";
    import { gravatarUrl } from "../../util/stores";
    import AddMemberModal from "../modals/AddMemberModal.svelte";
    import Spinner from "../Spinner.svelte";
    import ErrorTryAgain from "../ErrorTryAgain.svelte";

    /** @type {{ 
     *   isTeamOwner: boolean,
     *   teamId: number,
     * }} */
    let { isTeamOwner, teamId } = $props();

    let membersPromise = $state(getTeamMembers(teamId));

    /**
     * Remove a member from the team
     * @param {import('common').User} member
     */
    const handleRemoveMember = async (member) => {
        if (!confirm(`Are you sure you want to remove ${member.name} from this team?`)) {
            return;
        }

        await removeUserFromTeam(teamId, member.userId);
        membersPromise = getTeamMembers(teamId);
    };

    /**
     * Get user initials for profile logo
     * @param {string} name
     */
    const getUserInitials = (name) => {
        return name.split(' ').map(n => n.substring(0, 1).toUpperCase()).join('');
    };

    let showAddMember = $state(false);
</script>

<style>
    .members-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .section-title {
        font-size: 1.5rem;
        margin: 0;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        border-radius: 0.5rem;
        box-shadow: 0 0.15rem 0.15rem #0001;
        overflow: hidden;
        background-color: #fafafa;

        th {
            background-color: #f0f0f0;
            padding: 1rem;
            text-align: left;
            font-weight: 500;
            border-bottom: 1px solid #0003;

            &:first-child {
                width: 100%;
            }

            &:last-child {
                width: 120px;
                text-align: center;
            }
        }

        td {
            padding: 1rem;
            border-bottom: 1px solid #0001;
            vertical-align: middle;
        }

        tr {
            &:last-child td {
                border-bottom: none;
            }

            &:hover {
                background-color: #f8f8f8;
            }
        }
    }

    .member-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .member-details {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 0;
        flex: 1;
    }

    .member-name {
        font-weight: 500;
        color: #333;
        word-wrap: break-word;
    }

    .member-email {
        color: #666;
        font-size: 0.875rem;
        word-wrap: break-word;
    }

    .actions {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        min-width: 80px;
    }

    .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: #666;
    }

    .empty-state h3 {
        margin-bottom: 0.5rem;
        color: #333;
    }

    @media (max-width: 48rem) {
        table {
            font-size: 0.875rem;
        
            th, td {
                padding: 0.75rem 0.5rem;
            }

            th:last-child {
                width: 80px;
            }
        }

        .member-info {
            gap: 0.5rem;
        }

        .actions {
            min-width: 60px;
        }
    }
</style>

{#await membersPromise}
    <section class="loading-wrapper">
        <Spinner/>
    </section>
{:then members}
    <header class="members-header">
        <h2 class="section-title">Members ({members.length})</h2>
        {#if isTeamOwner}
            <button class="btn btn-primary" onclick={() => showAddMember = true}>
                <Plus/>
                Add Member
            </button>
        {/if}
    </header>

    {#if members.length === 0}
        <div class="empty-state">
            <h3>No members yet</h3>
            <p>Add members to your team to start collaborating.</p>
        </div>
    {:else}
        <table>
            <thead>
                <tr>
                    <th>Member</th>
                    {#if isTeamOwner}
                        <th>Actions</th>
                    {/if}
                </tr>
            </thead>
            <tbody>
                {#each members as member (member.userId)}
                    <tr>
                        <td>
                            <div class="member-info">
                                <ProfileLogo 
                                    logoSrc={gravatarUrl(member.email)} 
                                    initials={getUserInitials(member.name)}
                                />
                                <div class="member-details">
                                    <div class="member-name">{member.name}</div>
                                    <div class="member-email">{member.email}</div>
                                </div>
                            </div>
                        </td>
                        {#if isTeamOwner}
                            <td>
                                <div class="actions">
                                    <button 
                                        class="btn btn-small btn-danger" 
                                        onclick={() => handleRemoveMember(member)}
                                        title="Remove from team"
                                    >
                                        <UserMinus/>
                                    </button>
                                </div>
                            </td>
                        {/if}
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
    {#if isTeamOwner && showAddMember}
        <AddMemberModal
            {teamId}
            existingMembers={members}
            close={() => showAddMember = false}
            onMemberAdded={() => membersPromise = getTeamMembers(teamId)}
        />
    {/if}
{:catch error}
    <ErrorTryAgain {error} onTryAgain={() => membersPromise = getTeamMembers(teamId)}/>
{/await}