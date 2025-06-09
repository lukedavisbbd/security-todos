<script>
    import { getTeamById } from "../util/team";
    import Spinner from "../lib/Spinner.svelte";
    import TasksTab from "../lib/team-detail/TasksTab.svelte";
    import MembersTab from "../lib/team-detail/MembersTab.svelte";
    import { userJwtContents } from "../util/stores";
    import { ArrowLeft } from "@lucide/svelte";
    import { goto, route as softRoute } from "@mateothegreat/svelte5-router";
    import ReportsTab from "../lib/team-detail/ReportsTab.svelte";
    import DeleteTeamModal from "../lib/modals/DeleteTeamModal.svelte";

    let { route } = $props();
    
    const teamId = parseInt(route.result.path.params.teamId);
    
    let teamPromise = $state(getTeamById(teamId));
    
    let activeTab = $state('tasks');

    let showDeleteTeam = $state(false);
</script>

<style>
    header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;

        h3 {
            display: inline-block;
        }
    }

    .owner-badge {
        display: inline-block;
        color: #d4a574;
        margin-bottom: 1rem;
    }

    .tabs {
        display: flex;
        border-bottom: 1px solid #0003;
        margin-bottom: 2rem;
        
        button.tab {
            padding: 0.75rem 1.5rem;
            border: none;
            background: none;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            font-size: 1rem;
            color: #666;
            transition: all 150ms;

            &.active {
                color: #333;
                border-bottom-color: #007acc;
            }

            &:hover {
                color: #333;
                background-color: #f5f5f5;
            }
        }
    }

    .back-button {
        display: inline-flex;
    }
</style>

<main>
    <a class="btn back-button" use:softRoute href="/">
        <ArrowLeft/>
        Back to Teams
    </a>
    {#await teamPromise}
        <section class="loading-wrapper">
            <Spinner/>
        </section>
    {:then team}
        {#if team}
            {@const isTeamOwner = team.teamOwnerId === $userJwtContents?.user?.userId}
            <header>
                <section>
                    <h3>
                        {team.teamName}
                    </h3>
                    {#if isTeamOwner}
                        <h5 class="owner-badge" title="Team Owner">(Owned by you)</h5>
                    {/if}
                </section>
                {#if isTeamOwner}
                    <button
                        class="btn btn-danger delete-team-btn"
                        onclick={() => showDeleteTeam = true}
                        title="Delete team and all associated data"
                    >
                        Delete Team
                    </button>
                {/if}
            </header>
            <nav class="tabs">
                <button 
                    class="tab" 
                    class:active={activeTab === 'tasks'}
                    onclick={() => activeTab = 'tasks'}
                >
                    Tasks
                </button>
                <button 
                    class="tab" 
                    class:active={activeTab === 'members'}
                    onclick={() => activeTab = 'members'}
                >
                    Members
                </button>
                <button 
                    class="tab" 
                    class:active={activeTab === 'reports'}
                    onclick={() => activeTab = 'reports'}
                >
                    Reports
                </button>
            </nav>
            {#if activeTab === 'tasks'}
                <TasksTab
                    {teamId}
                />
            {:else if activeTab === 'members'}
                <MembersTab
                    {isTeamOwner}
                    {team}
                    refreshTeam={() => {
                        teamPromise = getTeamById(teamId);
                    }}
                />
            {:else if activeTab === 'reports'}
                <ReportsTab
                    {teamId}
                />
            {/if}
            {#if showDeleteTeam}
                <DeleteTeamModal
                    {team}
                    memberCount={team.memberCount}
                    taskCount={team.taskCount}
                    close={() => { showDeleteTeam = false }}
                    onTeamDeleted={() => goto('/')}
                />
            {/if}

        {:else}
            <section class="error-wrapper">
                <p>Team does not exist.</p>
            </section>
        {/if}
    {:catch error}
        <section class="error-wrapper">
            <p>{error.message}</p>
            <button class="btn btn-outline" onclick={() => teamPromise = getTeamById(teamId)}>
                Try Again
            </button>
        </section>
    {/await}
</main>
