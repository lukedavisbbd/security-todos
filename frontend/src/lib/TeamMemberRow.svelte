<script>
    import { Crown, UserMinus } from "@lucide/svelte";
    import ProfileLogo from "./ProfileLogo.svelte";
    import ConfirmationModal from "./modals/ConfirmationModal.svelte";
    import { promoteToTeamLead, removeUserFromTeam } from "../util/team";

    /**
     * @type {{
     *     member: import('common').PublicUser,
     *     team: import('common').Team,
     *     isTeamOwner: boolean,
     *     refreshTeam: (() => void) | (() => Promise<void>),
     *     refreshMembers: (() => void) | (() => Promise<void>),
     * }}
     */
    let { member, team, isTeamOwner, refreshTeam, refreshMembers } = $props();

    let showPromoteMenu = $state(false);
    let showDeleteMenu = $state(false);
</script>

<style>
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

    .actions {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        min-width: 80px;
    }

    @media (max-width: 48rem) {
        .member-info {
            gap: 0.5rem;
        }

        .actions {
            min-width: 60px;
        }
    }
</style>

<tr>
    <td>
        <div class="member-info">
            <ProfileLogo
                userId={member.userId}
                name={member.name}
            />
            <div class="member-details">
                <div class="member-name">{member.name}</div>
            </div>
        </div>
    </td>
    {#if isTeamOwner}
        <td>
            <div class="actions">
                {#if team.teamOwnerId != member.userId}
                    <button 
                        class="btn btn-small btn-primary" 
                        title="Promote to team lead"
                        onclick={() => showPromoteMenu = true}
                    >
                        <Crown/>
                    </button>
                    <button 
                        class="btn btn-small btn-danger" 
                        title="Remove from team"
                        onclick={() => showDeleteMenu = true}
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

{#if showPromoteMenu}
    <ConfirmationModal
        title="Promote to Team Lead"
        message="Are you sure you want to promote {member.name} to team lead? They will become the new owner of this team and you will become a regular member."
        confirmText="Promote to Lead"
        actionType="primary"
        close={() => showPromoteMenu = false}
        onConfirm={async () => {
            await promoteToTeamLead(team.teamId, member.userId);
            refreshTeam();
            showPromoteMenu = false;
        }}
    />
{/if}

{#if showDeleteMenu}
    <ConfirmationModal
        title="Remove Team Member"
        message="Are you sure you want to remove {member.name} from this team? They will lose access to all team tasks and data."
        confirmText="Remove Member"
        actionType="danger"
        close={() => showDeleteMenu = false}
        onConfirm={async () => {
            await removeUserFromTeam(team.teamId, member.userId);
            refreshMembers();
            showDeleteMenu = false;
        }}
    />
{/if}