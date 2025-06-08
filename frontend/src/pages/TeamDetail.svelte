<script>
    import { getTeamById } from "../util/team";
    import { getTasksForTeam } from "../util/tasks";
    import { getAllStatuses } from "../util/status";
    import { getTeamMembers } from "../util/team";
    import Spinner from "../lib/Spinner.svelte";
    import TasksTab from "../lib/team-detail/TasksTab.svelte";
    import MembersTab from "../lib/team-detail/MembersTab.svelte";
    import { userJwtContents } from "../util/stores";

    let { route } = $props();
    
    const teamId = parseInt(route.result.path.params.teamId);
    
    let teamPromise = $state(getTeamById(teamId));
    
    let activeTab = $state('tasks');
</script>

<style>
    .team-title {
        margin-bottom: 1rem;
    }

    .owner-badge {
        color: #d4a574;
        font-size: 1.5rem;
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
</style>

<main>
    {#await teamPromise}
        <section class="loading-wrapper">
            <Spinner/>
        </section>
    {:then team}
        {@const isTeamOwner = team.team_owner_id === $userJwtContents?.user?.userId}
        <h3 class="team-title">
            {team.team_name}
            {#if isTeamOwner}
                <span class="owner-badge" title="Team Owner">(Owned by you)</span>
            {/if}
        </h3>
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
        </nav>
        {#if activeTab === 'tasks'}
            <TasksTab
                {teamId}
            />
        {:else if activeTab === 'members'}
            <MembersTab
                {isTeamOwner}
                {teamId}
            />
        {/if}
    {:catch error}
        <div class="error-wrapper">
            <p>{error.message}</p>
            <button class="btn btn-outline" onclick={() => teamPromise = getTeamById(teamId)}>
                Try Again
            </button>
        </div>
    {/await}
</main>
