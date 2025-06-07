<script>
    import { Plus, Edit, History } from "@lucide/svelte";
    import { updateTaskStatus, assignTaskToUser } from "../../util/tasks";

    /** @type {{ 
     *   tasks: import('common').TaskWithAssignee[], 
     *   statuses: Array<{ status_id: number, status_name: string }>,
     *   members: import('common').TeamMember[],
     *   isTeamOwner: boolean,
     *   onCreateTask: () => void,
     *   onEditTask: (task: import('common').TaskWithAssignee) => void,
     *   onTaskUpdated: () => void
     * }} */
    let { tasks, statuses, members, isTeamOwner, onCreateTask, onEditTask, onTaskUpdated } = $props();

    /**
     * Get status name by ID
     * @param {number} statusId
     * @returns {string}
     */
    const getStatusName = (statusId) => {
        const status = statuses.find(s => s.status_id === statusId);
        return status ? status.status_name : 'Unknown';
    };

    /**
     * Get member name by email
     * @param {string | null} email
     * @returns {string}
     */
    const getMemberName = (email) => {
        if (!email) return 'Unassigned';
        const member = members.find(m => m.email === email);
        return member ? member.name : email;
    };

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
            onTaskUpdated();
        } else {
            // Revert the select value on error
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
            onTaskUpdated();
        } else {
            // Revert the select value on error
            const currentUserId = getMemberIdByEmail(task.assigned_to_email);
            event.target.value = currentUserId || 'null';
            alert('Failed to update task assignment');
        }
    };

    /**
     * Handle view history (placeholder)
     * @param {import('common').TaskWithAssignee} task
     */
    const handleViewHistory = (task) => {
        // Placeholder for future implementation
        alert(`History for task: ${task.task_name}\n\nThis feature will show the task's status and assignment history.`);
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

    .tasks-grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
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

    {#if tasks.length === 0}
        <div class="empty-state">
            <h3>No tasks yet</h3>
            <p>Create your first task to get started.</p>
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
                            <button 
                                class="btn btn-outline" 
                                onclick={() => handleViewHistory(task)}
                                title="View Task History"
                            >
                                <History/>
                                History
                            </button>
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
    {/if}
</section>