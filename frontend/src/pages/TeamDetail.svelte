<script>
    import { getTeamById } from "../util/team";
    import Spinner from "../lib/Spinner.svelte";
    import TasksTab from "../lib/team-detail/TasksTab.svelte";
    import MembersTab from "../lib/team-detail/MembersTab.svelte";
    import { userJwtContents } from "../util/stores";
    import { ArrowLeft } from "@lucide/svelte";
    import { route as softRoute } from "@mateothegreat/svelte5-router";

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
            <h3 class="team-title">
                {team.teamName}
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
