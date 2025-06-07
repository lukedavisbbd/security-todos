<script>
    import { Plus, Edit } from "@lucide/svelte";
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

    .tasks-table {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid #0003;
        border-radius: 0.5rem;
        overflow: hidden;
        background-color: #fafafa;
    }

    .tasks-table th {
        background-color: #f0f0f0;
        padding: 1rem;
        text-align: left;
        font-weight: 500;
        border-bottom: 1px solid #0003;
    }

    .tasks-table td {
        padding: 1rem;
        border-bottom: 1px solid #0001;
        vertical-align: top;
    }

    .tasks-table tr:last-child td {
        border-bottom: none;
    }

    .tasks-table tr:hover {
        background-color: #f8f8f8;
    }

    .task-name {
        font-weight: 500;
        margin-bottom: 0.25rem;
    }

    .task-content {
        color: #666;
        font-size: 0.875rem;
        line-height: 1.4;
    }

    .inline-select {
        border: 1px solid transparent;
        background: transparent;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 150ms;
    }

    .inline-select:hover {
        border-color: #0003;
        background-color: white;
    }

    .inline-select:focus {
        border-color: #007acc;
        background-color: white;
        outline: none;
    }

    .status-select {
        text-transform: uppercase;
        font-weight: 500;
        letter-spacing: 0.05em;
        font-size: 0.75rem;
    }

    .status-select option {
        text-transform: uppercase;
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
        .tasks-table {
            font-size: 0.875rem;
        }
        
        .tasks-table th,
        .tasks-table td {
            padding: 0.75rem 0.5rem;
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
            <button class="btn btn-primary" onclick={onCreateTask}>
                <Plus/>
                Create First Task
            </button>
        </div>
    {:else}
        <table class="tasks-table">
            <thead>
                <tr>
                    <th>Task</th>
                    <th>Assigned To</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {#each tasks as task (task.task_id)}
                    <tr>
                        <td>
                            <div class="task-name">{task.task_name}</div>
                            {#if task.task_content}
                                <div class="task-content">{task.task_content}</div>
                            {/if}
                        </td>
                        <td>
                            <select 
                                class="inline-select"
                                value={getMemberIdByEmail(task.assigned_to_email) || 'null'}
                                onchange={(e) => handleAssignmentChange(task, e)}
                            >
                                <option value="null">Unassigned</option>
                                {#each members as member (member.user_id)}
                                    <option value={member.user_id}>{member.name}</option>
                                {/each}
                            </select>
                        </td>
                        <td>
                            <select 
                                class="inline-select status-select"
                                value={task.status_id}
                                onchange={(e) => handleStatusChange(task, e)}
                            >
                                {#each statuses as status (status.status_id)}
                                    <option value={status.status_id}>{status.status_name}</option>
                                {/each}
                            </select>
                        </td>
                        <td>
                            <button 
                                class="btn btn-small btn-outline" 
                                onclick={() => onEditTask(task)}
                                title="Edit Task Details"
                            >
                                <Edit/>
                            </button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
</section>