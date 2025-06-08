<script>
    import { Plus, UserMinus, Crown, TrendingUp } from "@lucide/svelte";
    import { removeUserFromTeam, promoteToTeamLead } from "../../util/team";
    import ProfileLogo from "../ProfileLogo.svelte";
    import ConfirmationModal from "../modals/ConfirmationModal.svelte";
    import { gravatarUrl } from "../../util/stores";

    /** @type {{ 
     *   members: import('common').TeamMember[], 
     *   isTeamOwner: boolean,
     *   teamId: number,
     *   teamOwnerId: number,
     *   onAddMember: () => void,
     *   onRemoveMember: () => void
     * }} */
    let { members, isTeamOwner, teamId, teamOwnerId, onAddMember, onRemoveMember } = $props();

    let showConfirmation = $state(false);
    let confirmationConfig = $state({
        title: '',
        message: '',
        confirmText: '',
        actionType: 'primary',
        action: null
    });

    /**
     * Remove a member from the team
     * @param {import('common').TeamMember} member
     */
    const handleRemoveMember = (member) => {
        confirmationConfig = {
            title: 'Remove Team Member',
            message: `Are you sure you want to remove ${member.name} from this team? They will lose access to all team tasks and data.`,
            confirmText: 'Remove Member',
            actionType: 'danger',
            action: async () => {
                const result = await removeUserFromTeam(teamId, member.user_id);
                if (result && 'ok' in result) {
                    onRemoveMember();
                    showConfirmation = false;
                } else {
                    throw new Error('Failed to remove member from team.');
                }
            }
        };
        showConfirmation = true;
    };

    /**
     * Promote a member to team lead
     * @param {import('common').TeamMember} member
     */
    const handlePromoteMember = (member) => {
        confirmationConfig = {
            title: 'Promote to Team Lead',
            message: `Are you sure you want to promote ${member.name} to team lead? They will become the new owner of this team and you will become a regular member.`,
            confirmText: 'Promote to Lead',
            actionType: 'primary',
            action: async () => {
                const result = await promoteToTeamLead(teamId, member.user_id);
                if (result && 'ok' in result) {
                    onRemoveMember(); // Refresh the team data
                    showConfirmation = false;
                } else {
                    throw new Error('Failed to promote member to team lead.');
                }
            }
        };
        showConfirmation = true;
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
     * Check if member is the team owner
     * @param {import('common').TeamMember} member
     * @returns {boolean}
     */
    const isMemberTeamOwner = (member) => {
        return member.user_id === teamOwnerId;
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

    .capacity-info {
        color: #666;
        font-size: 0.875rem;
        margin-left: 0.5rem;
    }

    .capacity-warning {
        color: #d69e2e;
        font-weight: 500;
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
        width: 140px;
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
        display: flex;
        align-items: center;
        gap: 0.5rem;
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
        min-width: 120px;
        flex-wrap: wrap;
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
            min-width: 100px;
        }

        .members-table th:last-child {
            width: 120px;
        }
    }
</style>

<section>
    <header class="members-header">
        <div>
            <h2 class="section-title">
                Members ({members.length})
                <span class="capacity-info" class:capacity-warning={members.length >= 9}>
                    ({members.length}/10)
                </span>
            </h2>
        </div>
        {#if isTeamOwner && members.length < 10}
            <button class="btn btn-primary" onclick={onAddMember}>
                <Plus/>
                Add Member
            </button>
        {:else if isTeamOwner && members.length >= 10}
            <button class="btn btn-primary" disabled title="Team has reached maximum capacity">
                <Plus/>
                Team Full
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
                                    <div class="member-name">
                                        {member.name}
                                        {#if isMemberTeamOwner(member)}
                                            <Crown class="owner-badge" title="Team Owner"/>
                                        {/if}
                                    </div>
                                    <div class="member-email">{member.email}</div>
                                </div>
                            </div>
                        </td>
                        {#if isTeamOwner}
                            <td>
                                <div class="actions">
                                    {#if !isMemberTeamOwner(member)}
                                        <button 
                                            class="btn btn-small btn-primary" 
                                            onclick={() => handlePromoteMember(member)}
                                            title="Promote to team lead"
                                        >
                                            <TrendingUp/>
                                        </button>
                                        <button 
                                            class="btn btn-small btn-danger" 
                                            onclick={() => handleRemoveMember(member)}
                                            title="Remove from team"
                                        >
                                            <UserMinus/>
                                        </button>
                                    {:else}
                                        <span title="Team owner cannot be removed" style="color: #666; font-size: 0.75rem;">
                                            Owner
                                        </span>
                                    {/if}
                                </div>
                            </td>
                        {/if}
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
</section>

{#if showConfirmation}
    <ConfirmationModal 
        title={confirmationConfig.title}
        message={confirmationConfig.message}
        confirmText={confirmationConfig.confirmText}
        actionType={confirmationConfig.actionType}
        close={() => showConfirmation = false}
        onConfirm={confirmationConfig.action}
    />
{/if}