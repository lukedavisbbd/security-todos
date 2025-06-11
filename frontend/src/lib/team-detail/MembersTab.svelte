<script>
    import { Plus } from "@lucide/svelte";
    import { getTeamMembers, removeUserFromTeam } from "../../util/team";
    import AddMemberModal from "../modals/AddMemberModal.svelte";
    import Spinner from "../Spinner.svelte";
    import ErrorTryAgain from "../ErrorTryAgain.svelte";
    import TeamMemberRow from "../TeamMemberRow.svelte";

    /** @type {{ 
     *     team: import('common').Team,
     *     isTeamOwner: boolean,
     *     refreshTeam: (() => void) | (() => Promise<void>),
     * }} */
    let { team, isTeamOwner, refreshTeam } = $props();

    let membersPromise = $state(getTeamMembers(team.teamId));

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

        :global(td) {
            padding: 1rem;
            border-bottom: 1px solid #0001;
            vertical-align: middle;
        }

        :global(tr) {
            &:last-child td {
                border-bottom: none;
            }

            &:hover {
                background-color: #f8f8f8;
            }
        }
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
        
            th, :global(td) {
                padding: 0.75rem 0.5rem;
            }

            th:last-child {
                width: 80px;
            }
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
                    <TeamMemberRow
                        {member}
                        {isTeamOwner}
                        {team}
                        {refreshTeam}
                        refreshMembers={() => membersPromise = getTeamMembers(team.teamId)}
                    />
                {/each}
            </tbody>
        </table>
    {/if}
    {#if isTeamOwner && showAddMember}
        <AddMemberModal
            teamId={team.teamId}
            existingMembers={members}
            close={() => showAddMember = false}
            onMemberAdded={() => membersPromise = getTeamMembers(team.teamId)}
        />
    {/if}
{:catch error}
    <ErrorTryAgain {error} onTryAgain={() => membersPromise = getTeamMembers(team.teamId)}/>
{/await}
