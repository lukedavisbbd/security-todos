<script>
    import { Plus, UserMinus } from "@lucide/svelte";
    import { removeUserFromTeam } from "../../util/team";
    import ProfileLogo from "../ProfileLogo.svelte";
    import { gravatarUrl } from "../../util/stores";

    /** @type {{ 
     *   members: import('common').TeamMember[], 
     *   isTeamOwner: boolean,
     *   teamId: number,
     *   onAddMember: () => void,
     *   onRemoveMember: () => void
     * }} */
    let { members, isTeamOwner, teamId, onAddMember, onRemoveMember } = $props();

    /**
     * Remove a member from the team
     * @param {import('common').TeamMember} member
     */
    const handleRemoveMember = async (member) => {
        if (!confirm(`Are you sure you want to remove ${member.name} from this team?`)) {
            return;
        }

        const result = await removeUserFromTeam(teamId, member.user_id);
        if (result && 'ok' in result) {
            onRemoveMember();
        } else {
            alert('Failed to remove member from team.');
        }
    };

    /**
     * Get user initials for profile logo
     * @param {string} name
     * @returns {string}
     */
    const getUserInitials = (name) => {
        return name.split(' ').map(n => n.substring(0, 1).toUpperCase()).join('');
    };
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

    .members-table {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid #0003;
        border-radius: 0.5rem;
        overflow: hidden;
        background-color: #fafafa;
    }

    .members-table th {
        background-color: #f0f0f0;
        padding: 1rem;
        text-align: left;
        font-weight: 500;
        border-bottom: 1px solid #0003;
    }

    .members-table th:first-child {
        width: 100%;
    }

    .members-table th:last-child {
        width: 120px;
        text-align: center;
    }

    .members-table td {
        padding: 1rem;
        border-bottom: 1px solid #0001;
        vertical-align: middle;
    }

    .members-table tr:last-child td {
        border-bottom: none;
    }

    .members-table tr:hover {
        background-color: #f8f8f8;
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

    @media (max-width: 768px) {
        .members-table {
            font-size: 0.875rem;
        }
        
        .members-table th,
        .members-table td {
            padding: 0.75rem 0.5rem;
        }

        .member-info {
            gap: 0.5rem;
        }

        .actions {
            min-width: 60px;
        }

        .members-table th:last-child {
            width: 80px;
        }
    }
</style>

<section>
    <header class="members-header">
        <h2 class="section-title">Members ({members.length})</h2>
        {#if isTeamOwner}
            <button class="btn btn-primary" onclick={onAddMember}>
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
        <table class="members-table">
            <thead>
                <tr>
                    <th>Member</th>
                    {#if isTeamOwner}
                        <th>Actions</th>
                    {/if}
                </tr>
            </thead>
            <tbody>
                {#each members as member (member.user_id)}
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
</section>