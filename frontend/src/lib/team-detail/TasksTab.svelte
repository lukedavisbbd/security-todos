<script>
    import { Plus, Edit, History, ChevronLeft, ChevronRight } from "@lucide/svelte";
    import { assignTaskToUser, getTasksForTeam, updateTaskStatus } from "../../util/tasks";
    import { route } from "@mateothegreat/svelte5-router";
    import { getTeamMembers } from "../../util/team";
    import { getAllStatuses } from "../../util/status";
  import ErrorTryAgain from "../ErrorTryAgain.svelte";
  import Spinner from "../Spinner.svelte";

    /** @type {{ 
     *     teamId: number,
     * }} */
    let {
        teamId,
    } = $props();

    let allStatuses = getAllStatuses();
    
    let showCreateTask = $state(false);
    let showEditTask = $state(false);
    let editingTask = $state(null);

    let pagination = $state({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 5
    });

    /** @type {{
     *      userId: number | null | undefined,
     *      statusId: number | undefined,
    }} */
    let filters = $state({
        userId: undefined,
        statusId: undefined
    });

    const loadTasks = () => getTasksForTeam(teamId, {
        userId: filters.userId,
        statusId: filters.statusId,
        page: pagination.currentPage,
        limit: pagination.itemsPerPage
    });

    let tasksPromise = $derived(loadTasks());
    /** @type {Promise<void> | null} */
    let updateStatusPromise = $state(null);
    /** @type {Promise<void> | null} */
    let assignPromise = $state(null);
    
    let members = $state(getTeamMembers(teamId));

    const clearFilters = () => {
        filters = {
            userId: undefined,
            statusId: undefined,
        };
    };

    /**
     * @param {import('common').Task} task
     */
    const assignTask = async (task) => {
        const tasks = await tasksPromise;
        await assignTaskToUser(task.task_id, task.assigned_to_id ?? -1);
        const index = tasks.tasks.findIndex(t => t != task);
        if (index >= 0) {
            tasks.tasks[index].assigned_to_id
        }
    }

    /**
     * @param {import('common').Task} task
     */
    const updateStatus = async (task) => {
        tasksPromise = updateTaskStatus(task.task_id, task.status_id)
            .then(() => getTasksForTeam(teamId, {
                userId: filters.userId,
                statusId: filters.statusId,
                page: pagination.currentPage,
                limit: pagination.itemsPerPage
            }));
    }
</script>

<style>
    article.task-tab > header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .filters {
        background-color: #f8f9fa;
        border: 1px solid #0003;
        border-radius: 0.5rem;
        padding: 1rem;
        margin-bottom: 1.5rem;
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: center;

        section {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            min-width: 150px;
        }

        .clear-filters {
            margin-top: auto;
        }
    }

    select {
        border: 1px solid #0003;
        background: white;
        padding: 0.375rem 0.75rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 150ms;
    }
    
    .label {
        font-size: 0.75rem;
        font-weight: 500;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .tasks-grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        min-height: 200px;

        article {
            background-color: #fafafa;
            border: 1px solid #0003;
            border-radius: 0.5rem;
            padding: 1.25rem;
            transition: all 150ms;
            display: flex;
            flex-direction: column;
            gap: 1rem;

            &:hover {
                box-shadow: 0 0.25rem 0.5rem #0001;
                border-color: #0005;
            }

            header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 1rem;
                flex-wrap: wrap;

                section {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                }
            }

            .actions {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
                
                section {
                    display: flex;
                    flex-direction: column;
                }
            }
        }
    }

    .status-select {
        text-transform: uppercase;
        font-weight: 500;
        letter-spacing: 0.05em;
        font-size: 0.75rem;
        background-color: #f0f4f8;
        border-color: #007acc;
        color: #007acc;
        min-width: 100px;
    }

    .status-select option {
        text-transform: uppercase;
    }

    .pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 2rem;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .pagination-info {
        color: #666;
        font-size: 0.875rem;
    }

    .pagination-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .page-button {
        padding: 0.375rem 0.75rem;
        border: 1px solid #0003;
        background: white;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: all 150ms;
        font-size: 0.875rem;
    }

    .page-button:hover:not(:disabled) {
        background-color: #f8f9fa;
        border-color: #0005;
    }

    .page-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .page-button.active {
        background-color: #007acc;
        color: white;
        border-color: #007acc;
    }

    .page-size-selector {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #666;
    }

    .page-size-select {
        padding: 0.25rem 0.5rem;
        border: 1px solid #0003;
        border-radius: 0.25rem;
        font-size: 0.875rem;
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
        .pagination {
            flex-direction: column;
            align-items: center;
            gap: 1rem;
        }

        .pagination-controls {
            flex-wrap: wrap;
            justify-content: center;
        }
    }
</style>

<article class="task-tab">
    {#await Promise.all([tasksPromise, members, allStatuses])}
        <section class="loading-wrapper">
            <Spinner/>
        </section>
    {:then [{ tasks }, members, allStatuses]}
        <header>
            <h4>Tasks</h4>
            <button class="btn btn-primary">
                <Plus/>
                Create Task
            </button>
        </header>
        <section class="filters">
            <section>
                <label class="label" for="user-filter">Assigned To</label>
                <select 
                    id="user-filter"
                    bind:value={filters.userId}
                >
                    <option value={undefined}>Any User</option>
                    <option value={null}>Unassigned</option>
                    {#each members as member (member.user_id)}
                        <option value={member.user_id}>{member.name}</option>
                    {/each}
                </select>
            </section>
            <section>
                <label class="label" for="status-filter">Status</label>
                <select 
                    id="status-filter"
                    class="status-select"
                    bind:value={filters.statusId}
                >
                    <option value={undefined}>Any Status</option>
                    {#each allStatuses as status (status.status_id)}
                        <option value={status.status_id}>{status.status_name}</option>
                    {/each}
                </select>
            </section>
            {#if filters.userId !== undefined || filters.statusId !== undefined}
                <button class="btn btn-outline clear-filters" onclick={clearFilters}>
                    Clear Filters
                </button>
            {/if}
        </section>
        {#if tasks.length === 0}
            <section class="empty-state">
                <h3>No tasks found</h3>
                <p>
                    {#if filters.userId !== undefined || filters.statusId !== undefined}
                        No tasks match the current filters. Try adjusting your filters or create a new task.
                    {:else}
                        Create your first task to get started.
                    {/if}
                </p>
            </section>
        {:else}
            <section class="tasks-grid">
                {#each tasks as task (task.task_id)}
                    <article>
                        <header>
                            <h5>{task.task_name}</h5>                        
                            <section>
                                <a
                                    class="btn btn-outline" 
                                    href="/history/{task.task_id}"
                                    use:route
                                >
                                    <History/>
                                    History
                                </a>
                                <button 
                                    class="btn btn-outline" 
                                    onclick={() => tasksPromise = getTasksForTeam(teamId)}
                                    title="Edit Task Details"
                                >
                                    <Edit/>
                                    Edit
                                </button>
                            </section>
                        </header>

                        <section class="actions">
                            <section>
                                <label class="label" for="assigned-{task.task_id}">Assigned to:</label>
                                <select 
                                    id="assigned-{task.task_id}"
                                    bind:value={task.assigned_to_email}
                                    onchange={() => assignTask(task)}
                                >
                                    <option value={null}>Unassigned</option>
                                    {#each members as member (member.user_id)}
                                        <option value={member.user_id}>{member.name}</option>
                                    {/each}
                                </select>
                            </section>
                            <section>
                                <label class="label" for="status-{task.task_id}">Status:</label>
                                <select 
                                    id="status-{task.task_id}"
                                    class="status-select"
                                    bind:value={task.status_id}
                                    onchange={() => updateStatus(task)}
                                >
                                    {#each allStatuses as status (status.status_id)}
                                        <option value={status.status_id}>{status.status_name}</option>
                                    {/each}
                                </select>
                            </section>
                        </section>

                        {#if task.task_content}
                            <section>
                                <p class="label">Description:</p>
                                <p>{task.task_content}</p>
                            </section>
                        {/if}
                    </article>
                {/each}
            </section>
            <div class="pagination">
                <!-- <div class="pagination-info">
                    Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}–{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} tasks
                </div>
                
                <div class="pagination-controls">
                    <button 
                        class="page-button"
                        disabled={pagination.currentPage <= 1}
                        onclick={() => onPageChange(pagination.currentPage - 1)}
                    >
                        <ChevronLeft/>
                        Previous
                    </button>
                    
                    {#each getPageNumbers() as pageNum}
                        <button 
                            class="page-button"
                            class:active={pageNum === pagination.currentPage}
                            onclick={() => onPageChange(pageNum)}
                        >
                            {pageNum}
                        </button>
                    {/each}
                    
                    <button 
                        class="page-button"
                        disabled={pagination.currentPage >= pagination.totalPages}
                        onclick={() => onPageChange(pagination.currentPage + 1)}
                    >
                        Next
                        <ChevronRight/>
                    </button>
                </div>
                
                <div class="page-size-selector">
                    <span>Per page:</span>
                    <select 
                        class="page-size-select"
                        value={pagination.itemsPerPage}
                        onchange={(e) => onLimitChange(Number(e.target.value))}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div> -->
            </div>
        {/if}
    {:catch error}
        <ErrorTryAgain {error} onTryAgain={() => tasksPromise = loadTasks()}/>
    {/await}

</article>

<!-- {#if showCreateTask}
    <CreateTaskModal 
        {teamId}
        {members}
        {statuses}
        close={() => showCreateTask = false}
        onTaskCreated={() => {}}
    />
{/if}

{#if showEditTask && editingTask}
    <EditTaskModal
        task={editingTask}
        close={() => {
            showEditTask = false;
            editingTask = null;
        }}
        onTaskUpdated={() => {}}
    />
{/if} -->