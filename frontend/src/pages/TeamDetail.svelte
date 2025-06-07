<script>
    import { onMount } from "svelte";
    import { requireAuth } from "../util/auth-guard";
    import { getTeamById } from "../util/team";
    import { getTasksForTeam } from "../util/tasks";
    import { getAllStatuses } from "../util/status";
    import { getTeamMembers } from "../util/team";
    import Spinner from "../lib/Spinner.svelte";
    import TasksTab from "../lib/team-detail/TasksTab.svelte";
    import MembersTab from "../lib/team-detail/MembersTab.svelte";
    import CreateTaskModal from "../lib/modals/CreateTaskModal.svelte";
    import EditTaskModal from "../lib/modals/EditTaskModal.svelte";
    import AddMemberModal from "../lib/modals/AddMemberModal.svelte";
    import { userJwtContents } from "../util/stores";

    let { route } = $props();
    const teamId = parseInt(route.result.path.params.teamId);
    
    const authGuard = requireAuth();
    const authState = $derived($authGuard);
    
    let team = $state(null);
    let tasks = $state([]);
    let members = $state([]);
    let statuses = $state([]);
    let loading = $state(true);
    let error = $state('');
    let activeTab = $state('tasks');

    let showCreateTask = $state(false);
    let showEditTask = $state(false);
    let showAddMember = $state(false);
    let editingTask = $state(null);

    const isTeamOwner = $derived(team && $userJwtContents && team.team_owner_id === $userJwtContents.user.userId);

    const loadTeamData = async () => {
        loading = true;
        error = '';
        
        try {
            const teamResult = await getTeamById(teamId);
            if (!teamResult || 'err' in teamResult) {
                error = teamResult?.err?.message || 'Failed to load team';
                return;
            }
            team = teamResult.ok;

            const tasksResult = await getTasksForTeam(teamId);
            if (!tasksResult || 'err' in tasksResult) {
                error = 'Failed to load tasks';
                return;
            }
            tasks = tasksResult.ok;

            const membersResult = await getTeamMembers(teamId);
            if (!membersResult || 'err' in membersResult) {
                error = 'Failed to load members';
                return;
            }
            members = membersResult.ok;

            const statusesResult = await getAllStatuses();
            if (!statusesResult || 'err' in statusesResult) {
                error = 'Failed to load statuses';
                return;
            }
            statuses = statusesResult.ok;

        } catch (err) {
            error = 'An unexpected error occurred';
            console.error(err);
        } finally {
            loading = false;
        }
    };

    const handleTaskCreated = (newTask) => {
        loadTeamData();
    };

    const handleTaskUpdated = () => {
        loadTeamData();
        showEditTask = false;
        editingTask = null;
    };

    const handleMemberAdded = () => {
        loadTeamData();
        showAddMember = false;
    };

    const handleMemberRemoved = () => {
        loadTeamData();
    };

    const openEditTask = (task) => {
        editingTask = task;
        showEditTask = true;
    };

    onMount(() => {
        if (isNaN(teamId)) {
            error = 'Invalid team ID';
            loading = false;
            return;
        }

        if (authState.isAuthorized) {
            loadTeamData();
        }
    });

    $effect(() => {
        if (authState.isAuthorized && !team && !loading && !error) {
            loadTeamData();
        }
    });
</script>

<style>
    .team-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .team-title {
        font-size: 2rem;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .owner-badge {
        color: #d4a574;
        font-size: 1.5rem;
    }

    .tabs {
        display: flex;
        border-bottom: 1px solid #0003;
        margin-bottom: 2rem;
    }

    .tab {
        padding: 0.75rem 1.5rem;
        border: none;
        background: none;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        font-size: 1rem;
        color: #666;
        transition: all 150ms;
    }

    .tab.active {
        color: #333;
        border-bottom-color: #007acc;
    }

    .tab:hover {
        color: #333;
        background-color: #f5f5f5;
    }

    .loading-state {
        text-align: center;
        padding: 3rem 1rem;
        font-size: 2rem;
    }

    .error-state {
        text-align: center;
        padding: 2rem 1rem;
        color: #b00;
        background-color: #fdd;
        border-radius: 0.5rem;
        margin-bottom: 2rem;
    }
</style>

<main>
    <article>
        {#if authState.isLoading}
            <div class="loading-state">
                <Spinner/>
            </div>
        {:else if authState.isAuthorized}
            {#if loading}
                <div class="loading-state">
                    <Spinner/>
                </div>
            {:else if error}
                <div class="error-state">
                    <p>{error}</p>
                    <button class="btn btn-outline" onclick={loadTeamData}>
                        Try Again
                    </button>
                </div>
            {:else if team}
                <header class="team-header">
                    <div class="team-title">
                        {`Team: ${team.team_name}!`}
                        {#if isTeamOwner}
                            <span class="owner-badge" title="Team Owner">(Owned by you)</span>
                        {/if}
                    </div>
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
                </nav>

                {#if activeTab === 'tasks'}
                    <TasksTab 
                        {tasks} 
                        {statuses}
                        {members}
                        {isTeamOwner}
                        onCreateTask={() => showCreateTask = true}
                        onEditTask={openEditTask}
                        onTaskUpdated={loadTeamData}
                    />
                {:else if activeTab === 'members'}
                    <MembersTab 
                        {members} 
                        {isTeamOwner}
                        onAddMember={() => showAddMember = true}
                        onRemoveMember={handleMemberRemoved}
                        teamId={teamId}
                    />
                {/if}
            {/if}
        {/if}
    </article>
</main>

{#if showCreateTask && authState.isAuthorized && team}
    <CreateTaskModal 
        {teamId}
        {members}
        {statuses}
        close={() => showCreateTask = false}
        onTaskCreated={handleTaskCreated}
    />
{/if}

{#if showEditTask && authState.isAuthorized && editingTask}
    <EditTaskModal 
        task={editingTask}
        close={() => {
            showEditTask = false;
            editingTask = null;
        }}
        onTaskUpdated={handleTaskUpdated}
    />
{/if}

{#if showAddMember && authState.isAuthorized && isTeamOwner}
    <AddMemberModal 
        {teamId}
        existingMembers={members}
        close={() => showAddMember = false}
        onMemberAdded={handleMemberAdded}
    />
{/if}