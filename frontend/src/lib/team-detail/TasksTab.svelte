<script>
    import { Plus, ChevronLeft, ChevronRight } from "@lucide/svelte";
    import { getTasksForTeam } from "../../util/tasks";
    import { getTeamMembers } from "../../util/team";
    import { getAllStatuses } from "../../util/status";
    import ErrorTryAgain from "../ErrorTryAgain.svelte";
    import Spinner from "../Spinner.svelte";
    import TaskCard from "../TaskCard.svelte";
    import CreateTaskModal from "../modals/CreateTaskModal.svelte";

    /** @type {{ 
     *     teamId: number,
     * }} */
    let {
        teamId,
    } = $props();

    let allStatuses = $state(getAllStatuses());
    
    let showCreateTask = $state(false);

    let pagination = $state({
        currentPage: 1,
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
    }).then(data => {
        pagination.currentPage = Math.min(pagination.currentPage, data.pagination.totalPages);
        return data;
    });

    let tasksPromise = $derived(loadTasks());
    
    let members = $state(getTeamMembers(teamId));

    const clearFilters = () => {
        filters = {
            userId: undefined,
            statusId: undefined,
        };
    };

    /**
     * @param {number} totalPages
     */
    const getPageNumbers = (totalPages) => {
        const pages = [];

        for (let i = pagination.currentPage - 2; i <= pagination.currentPage + 2; i++) {
            if (1 <= i && i <= totalPages) {
                pages.push(i);
            }
        }

        return pages;
    };
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
    {:then [{ tasks, pagination: paginationInfo }, members, allStatuses]}
        <header>
            <h4>Tasks</h4>
            <button class="btn btn-primary" onclick={() => showCreateTask = true}>
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
                    {#each members as member (member.userId)}
                        <option value={member.userId}>{member.name}</option>
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
                    {#each allStatuses as status (status.statusId)}
                        <option value={status.statusId}>{status.statusName}</option>
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
            {@const pageNumbers = getPageNumbers(paginationInfo.totalPages)}
            <section class="tasks-grid">
                {#each tasks as task (task.taskId)}
                    <TaskCard {task} {allStatuses} {members} onTaskUpdated={() => tasksPromise = loadTasks()}/>
                {/each}
            </section>
            <div class="pagination">
                <div class="pagination-info">
                    Showing
                    {(paginationInfo.currentPage - 1) * paginationInfo.itemsPerPage + 1}
                    –
                    {Math.min(paginationInfo.currentPage * paginationInfo.itemsPerPage, paginationInfo.totalItems)}
                    of
                    {paginationInfo.totalItems}
                    tasks
                </div>
                
                <div class="pagination-controls">
                    <button 
                        class="page-button"
                        disabled={pagination.currentPage <= 1}
                        onclick={() => pagination.currentPage = Math.max(pagination.currentPage - 1, 1)}
                    >
                        <ChevronLeft/>
                        Previous
                    </button>
                    
                    {#if !pageNumbers.includes(1)}
                        &hellip;
                    {/if}
                    
                    {#each pageNumbers as page}
                        <button 
                            class="page-button"
                            class:active={page === pagination.currentPage}
                            onclick={() => pagination.currentPage = page}
                        >
                            {page}
                        </button>
                    {/each}
                    
                    {#if !pageNumbers.includes(paginationInfo.totalPages)}
                        &hellip;
                    {/if}
                    
                    <button 
                        class="page-button"
                        disabled={pagination.currentPage >= paginationInfo.totalPages}
                        onclick={() => pagination.currentPage = Math.min(pagination.currentPage + 1, paginationInfo.totalPages)}
                    >
                        Next
                        <ChevronRight/>
                    </button>
                </div>
                
                <div class="page-size-selector">
                    <span>Per page:</span>
                    <select 
                        class="page-size-select"
                        bind:value={pagination.itemsPerPage}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>
        {/if}
        {#if showCreateTask}
            <CreateTaskModal 
                {teamId}
                {members}
                {allStatuses}
                close={() => showCreateTask = false}
                onTaskCreated={() => tasksPromise = loadTasks()}
            />
        {/if}
    {:catch error}
        <ErrorTryAgain {error} onTryAgain={() => {
            tasksPromise = loadTasks();
            members = getTeamMembers(teamId);
            allStatuses = getAllStatuses();
        }}/>
    {/await}
</article>
