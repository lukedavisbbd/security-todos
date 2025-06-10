<script>
    import { History, Edit } from '@lucide/svelte';
    import { route } from '@mateothegreat/svelte5-router';
    import { assignTaskToUser, updateTaskStatus } from '../util/tasks';
    import Spinner from './Spinner.svelte';
    import EditTaskModal from './modals/EditTaskModal.svelte';

    /** @type {{
     *      task: import('common').Task,
     *      allStatuses: import('common').Status[],
     *      members: import('common').User[],
     *      onTaskUpdated: () => void,
     *  }} */
    let { task, allStatuses, members, onTaskUpdated } = $props();

    let assignLoading = $state(false);
    let assignError = $state('');

    let statusLoading = $state(false);
    let statusError = $state('');

    let showEditTask = $state(false);

    /**
     * @param {import('common').Task} task
     */
    const assignTask = (task) => {
        assignLoading = true;
        assignError = '';
        assignTaskToUser(task.taskId, task.assignedToId)
            .then(() => assignLoading = false)
            .catch(error => {
                assignLoading = false;
                assignError = error?.message ?? 'Failed to assign user.';
            })
    }

    /**
     * @param {import('common').Task} task
     */
    const updateStatus = async (task) => {
        statusLoading = true;
        statusError = '';
        assignTaskToUser(task.taskId, task.assignedToId)
            .then(() => statusLoading = false)
            .catch(error => {
                statusLoading = false;
                statusError = error?.message ?? 'Failed to update status.';
            })
    }
</script>

<style>
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

            nav {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
            }
        }

        .task-controls {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .control-group {
            display: flex;
            flex-direction: column;
        }

        .task-description {
            margin-top: 0.5rem;
        }
    }
</style>

<article>
    <header>
        <h3>{task.taskName}</h3>
        <nav aria-label="Task actions">
            <a
                class="btn btn-outline" 
                href="/history/{task.taskId}"
                use:route
                aria-label="View task history"
            >
                <History/>
                History
            </a>
            <button 
                class="btn btn-outline" 
                onclick={() => showEditTask = true}
                aria-label="Edit task details"
            >
                <Edit/>
                Edit
            </button>
        </nav>
    </header>

    <section class="task-controls" aria-label="Task assignment and status controls">
        <fieldset class="control-group">
            <legend class="label">
                Assigned to:
                {#if assignLoading}
                    <Spinner/>
                {/if}
            </legend>
            <select 
                id="assigned-{task.taskId}"
                bind:value={task.assignedToId}
                onchange={() => assignTask(task)}
                aria-describedby={assignError ? `assign-error-${task.taskId}` : undefined}
            >
                <option value={null}>Unassigned</option>
                {#each members as member (member.userId)}
                    <option value={member.userId}>{member.name}</option>
                {/each}
            </select>
            {#if assignError}
                <p class="error" id="assign-error-{task.taskId}" role="alert">
                    {assignError}
                </p>
            {/if}
        </fieldset>
        
        <fieldset class="control-group">
            <legend class="label">
                Status:
                {#if statusLoading}
                    <Spinner/>
                {/if}
            </legend>
            <select
                id="status-{task.taskId}"
                class="status-select"
                bind:value={task.statusId}
                onchange={() => updateStatus(task)}
                aria-describedby={statusError ? `status-error-${task.taskId}` : undefined}
            >
                {#each allStatuses as status (status.statusId)}
                    <option value={status.statusId}>{status.statusName}</option>
                {/each}
            </select>
            {#if statusError}
                <p class="error" id="status-error-{task.taskId}" role="alert">
                    {statusError}
                </p>
            {/if}
        </fieldset>
    </section>

    {#if task.taskContent}
        <section class="task-description">
            <h4>Description:</h4>
            <p>{task.taskContent}</p>
        </section>
    {/if}
</article>

{#if showEditTask}
    <EditTaskModal
        {task}
        close={() => showEditTask = false}
        {onTaskUpdated}
    />
{/if}