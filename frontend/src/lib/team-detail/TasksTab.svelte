<script>
    import { Plus, Edit, History, ChevronLeft, ChevronRight } from "@lucide/svelte";
    import { updateTaskStatus, assignTaskToUser } from "../../util/tasks";
    import { route } from "@mateothegreat/svelte5-router";
    import Spinner from "../Spinner.svelte";

    /** @type {{ 
     *   tasks: import('common').TaskWithAssignee[], 
     *   statuses: Array<{ status_id: number, status_name: string }>,
     *   members: import('common').TeamMember[],
     *   isTeamOwner: boolean,
     *   pagination: {currentPage: number, totalPages: number, totalItems: number, itemsPerPage: number},
     *   filters: {userId?: number|null, statusId?: number},
     *   onCreateTask: () => void,
     *   onEditTask: (task: import('common').TaskWithAssignee) => void,
     *   onFiltersChange: (filters: {userId?: number|null, statusId?: number}) => void,
     *   onPageChange: (page: number) => void,
     *   onLimitChange: (limit: number) => void,
     *   loading?: boolean
     * }} */
    let { 
        tasks, 
        statuses, 
        members,
        pagination,
        filters,
        onCreateTask,
        onEditTask,
        onFiltersChange,
        onPageChange,
        onLimitChange,
        loading = false
    } = $props();

    let selectedUserId = $state(filters.userId);
    let selectedStatusId = $state(filters.statusId);

    $effect(() => {
        selectedUserId = filters.userId;
        selectedStatusId = filters.statusId;
    });

    /**
     * Get member ID by email
     * @param {string | null} email
     * @returns {number | null}
     */
    const getMemberIdByEmail = (email) => {
        if (!email) return null;
        const member = members.find(m => m.email === email);
        return member ? member.user_id : null;
    };

    /**
     * Handle status change
     * @param {import('common').TaskWithAssignee} task
     * @param {Event} event
     */
    const handleStatusChange = async (task, event) => {
        const newStatusId = Number(event.target.value);
        const result = await updateTaskStatus(task.task_id, newStatusId);
        
        if (result && 'ok' in result) {
            onPageChange(pagination.currentPage);
        } else {
            event.target.value = task.status_id;
            alert('Failed to update task status');
        }
    };

    /**
     * Handle assignment change
     * @param {import('common').TaskWithAssignee} task
     * @param {Event} event
     */
    const handleAssignmentChange = async (task, event) => {
        const newUserId = event.target.value === 'null' ? null : Number(event.target.value);
        const result = await assignTaskToUser(task.task_id, newUserId);
        
        if (result && 'ok' in result) {
            onPageChange(pagination.currentPage);
        } else {
            const currentUserId = getMemberIdByEmail(task.assigned_to_email);
            event.target.value = currentUserId || 'null';
            alert('Failed to update task assignment');
        }
    };

    /**
     * Handle user filter change
     * @param {Event} event
     */
    const handleUserFilterChange = (event) => {
        const value = event.target.value;
        const userId = value === '' ? undefined : (value === 'null' ? null : Number(value));
        selectedUserId = userId;
        onFiltersChange({ ...filters, userId });
    };

    /**
     * Handle status filter change
     * @param {Event} event
     */
    const handleStatusFilterChange = (event) => {
        const value = event.target.value;
        const statusId = value === '' ? undefined : Number(value);
        selectedStatusId = statusId;
        onFiltersChange({ ...filters, statusId });
    };

    /**
     * Clear all filters
     */
    const clearFilters = () => {
        selectedUserId = undefined;
        selectedStatusId = undefined;
        onFiltersChange({});
    };

    /**
     * Generate array of page numbers for pagination
     * @returns {number[]}
     */
    const getPageNumbers = () => {
        const { currentPage, totalPages } = pagination;
        const pages = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            let start = Math.max(1, currentPage - 2);
            let end = Math.min(totalPages, start + maxVisible - 1);
            
            if (end - start < maxVisible - 1) {
                start = Math.max(1, end - maxVisible + 1);
            }
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
        }
        
        return pages;
    };
</script>

<style>
    .tasks-header {
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

    .filters-section {
        background-color: #f8f9fa;
        border: 1px solid #0003;
        border-radius: 0.5rem;
        padding: 1rem;
        margin-bottom: 1.5rem;
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: center;
    }

    .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 150px;
    }

    .filter-label {
        font-size: 0.75rem;
        font-weight: 500;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .filter-select {
        border: 1px solid #0003;
        background: white;
        padding: 0.375rem 0.75rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 150ms;
    }

    .filter-select:hover {
        border-color: #0005;
        box-shadow: 0 0.125rem 0.25rem #0001;
    }

    .filter-select:focus {
        border-color: #007acc;
        outline: none;
        box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
    }

    .clear-filters {
        margin-top: auto;
    }

    .tasks-grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        min-height: 200px;
    }

    .loading-overlay {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 3rem;
        color: #666;
        font-size: 1.2rem;
    }

    .task-card {
        background-color: #fafafa;
        border: 1px solid #0003;
        border-radius: 0.5rem;
        padding: 1.25rem;
        transition: all 150ms;
    }

    .task-card:hover {
        box-shadow: 0 0.25rem 0.5rem #0001;
        border-color: #0005;
    }

    .task-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 0.75rem;
        flex-wrap: wrap;
    }

    .task-title-section {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .title-field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    .task-name {
        font-weight: 500;
        font-size: 1.125rem;
        color: #333;
        word-wrap: break-word;
        margin: 0;
    }

    .description-field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .description-label {
        font-size: 0.75rem;
        font-weight: 500;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .task-meta {
        display: flex;
        gap: 1.5rem;
        align-items: flex-start;
        flex-wrap: wrap;
    }

    .meta-field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 120px;
    }

    .meta-label {
        font-size: 0.75rem;
        font-weight: 500;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .task-content {
        color: #666;
        font-size: 0.9rem;
        line-height: 1.5;
        white-space: pre-wrap;
        word-wrap: break-word;
        margin: 0;
    }

    .task-actions {
        flex-shrink: 0;
        display: flex;
        gap: 0.75rem;
    }

    .inline-select {
        border: 1px solid #0003;
        background: white;
        padding: 0.375rem 0.75rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 150ms;
        min-width: 120px;
    }

    .inline-select:hover {
        border-color: #0005;
        box-shadow: 0 0.125rem 0.25rem #0001;
    }

    .inline-select:focus {
        border-color: #007acc;
        outline: none;
        box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
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

    .assignment-select {
        color: #666;
        background-color: #f8f9fa;
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

    @media (max-width: 768px) {
        .filters-section {
            flex-direction: column;
            align-items: stretch;
        }

        .filter-group {
            min-width: unset;
        }

        .task-header {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
        }

        .task-meta {
            gap: 1rem;
        }

        .meta-field {
            min-width: 100px;
        }

        .task-actions {
            align-self: flex-end;
            flex-direction: column;
            width: 100%;
            gap: 0.5rem;
        }

        .task-actions button {
            width: 100%;
            justify-content: center;
        }

        .inline-select {
            min-width: 100px;
            font-size: 0.8rem;
        }

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

<section>
    <header class="tasks-header">
        <h2 class="section-title">Tasks</h2>
        <button class="btn btn-primary" onclick={onCreateTask}>
            <Plus/>
            Create Task
        </button>
    </header>

    <div class="filters-section">
        <div class="filter-group">
            <label class="filter-label" for="user-filter">Assigned To</label>
            <select 
                id="user-filter"
                class="filter-select"
                value={selectedUserId === undefined ? '' : (selectedUserId === null ? 'null' : selectedUserId)}
                onchange={handleUserFilterChange}
            >
                <option value="">All Users</option>
                <option value="null">Unassigned</option>
                {#each members as member (member.user_id)}
                    <option value={member.user_id}>{member.name}</option>
                {/each}
            </select>
        </div>
        
        <div class="filter-group">
            <label class="filter-label" for="status-filter">Status</label>
            <select 
                id="status-filter"
                class="filter-select"
                value={selectedStatusId === undefined ? '' : selectedStatusId}
                onchange={handleStatusFilterChange}
            >
                <option value="">All Statuses</option>
                {#each statuses as status (status.status_id)}
                    <option value={status.status_id}>{status.status_name}</option>
                {/each}
            </select>
        </div>
        
        {#if selectedUserId !== undefined || selectedStatusId !== undefined}
            <button class="btn btn-outline clear-filters" onclick={clearFilters}>
                Clear Filters
            </button>
        {/if}
    </div>

    {#if loading}
        <div class="loading-overlay">
            <Spinner/>
            Loading tasks...
        </div>
    {:else if tasks.length === 0}
        <div class="empty-state">
            <h3>No tasks found</h3>
            <p>
                {#if selectedUserId !== undefined || selectedStatusId !== undefined}
                    No tasks match the current filters. Try adjusting your filters or create a new task.
                {:else}
                    Create your first task to get started.
                {/if}
            </p>
        </div>
    {:else}
        <div class="tasks-grid">
            {#each tasks as task (task.task_id)}
                <div class="task-card">
                    <div class="task-header">
                        <div class="task-title-section">
                            <div class="title-field">
                                <div class="task-name">{task.task_name}</div>
                            </div>
                            
                            <div class="task-meta">
                                <div class="meta-field">
                                    <label class="meta-label" for="assigned-{task.task_id}">Assigned to:</label>
                                    <select 
                                        id="assigned-{task.task_id}"
                                        class="inline-select assignment-select"
                                        value={getMemberIdByEmail(task.assigned_to_email) || 'null'}
                                        onchange={(e) => handleAssignmentChange(task, e)}
                                    >
                                        <option value="null">Unassigned</option>
                                        {#each members as member (member.user_id)}
                                            <option value={member.user_id}>{member.name}</option>
                                        {/each}
                                    </select>
                                </div>
                                
                                <div class="meta-field">
                                    <label class="meta-label" for="status-{task.task_id}">Status:</label>
                                    <select 
                                        id="status-{task.task_id}"
                                        class="inline-select status-select"
                                        value={task.status_id}
                                        onchange={(e) => handleStatusChange(task, e)}
                                    >
                                        {#each statuses as status (status.status_id)}
                                            <option value={status.status_id}>{status.status_name}</option>
                                        {/each}
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div class="task-actions">
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
                                onclick={() => onEditTask(task)}
                                title="Edit Task Details"
                            >
                                <Edit/>
                                Edit
                            </button>
                        </div>
                    </div>
                    
                    {#if task.task_content}
                        <div class="description-field">
                            <label class="description-label">Description:</label>
                            <div class="task-content">{task.task_content}</div>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>

        <div class="pagination">
            <div class="pagination-info">
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
                    <option value={15}>15</option>
                </select>
            </div>
        </div>
    {/if}
</section>