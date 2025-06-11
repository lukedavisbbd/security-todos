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
        updateTaskStatus(task.taskId, task.statusId)
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
        padding: clamp(0.875rem, 2.5vw, 1.25rem);
        transition: all 150ms;
        display: flex;
        flex-direction: column;
        gap: clamp(0.75rem, 2vw, 1rem);

        &:hover {
            box-shadow: 0 0.25rem 0.5rem #0001;
            border-color: #0005;
        }
    }

    header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: clamp(0.75rem, 2vw, 1rem);
        flex-wrap: wrap;
    }

    header h3 {
        font-size: clamp(1rem, 2.5vw, 1.25rem);
        font-weight: 600;
        color: #2d3748;
        margin: 0;
        line-height: 1.3;
        word-break: break-word;
        flex: 1;
        min-width: 0;
    }

    header nav {
        display: flex;
        gap: clamp(0.5rem, 1.5vw, 0.75rem);
        flex-wrap: wrap;
        flex-shrink: 0;
    }

    header nav a,
    header nav button {
        font-size: clamp(0.75rem, 1.5vw, 0.875rem);
        padding: clamp(0.25rem, 1vw, 0.375rem) clamp(0.5rem, 1.5vw, 0.75rem);
        white-space: nowrap;
    }

    .task-controls {
        display: flex;
        gap: clamp(0.75rem, 2vw, 1rem);
        flex-wrap: wrap;
    }

    .control-group {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-width: clamp(120px, 20vw, 150px);
    }

    .control-group legend {
        font-size: clamp(0.65rem, 1.5vw, 0.75rem);
        font-weight: 500;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.25rem;
    }

    .control-group select {
        font-size: clamp(0.75rem, 1.5vw, 0.875rem);
        padding: clamp(0.25rem, 1vw, 0.375rem) clamp(0.5rem, 1.5vw, 0.75rem);
        border: 1px solid #0003;
        border-radius: 0.375rem;
        background: white;
    }

    .task-description {
        margin-top: clamp(0.375rem, 1vw, 0.5rem);
    }

    .task-description h4 {
        font-size: clamp(0.875rem, 2vw, 1rem);
        font-weight: 500;
        color: #4a5568;
        margin-bottom: clamp(0.25rem, 0.5vw, 0.375rem);
    }

    .task-description p {
        font-size: clamp(0.8rem, 1.8vw, 0.875rem);
        color: #666;
        line-height: 1.5;
        word-break: break-word;
    }

    .error {
        font-size: clamp(0.65rem, 1.3vw, 0.75rem);
        color: #e53e3e;
        margin-top: 0.25rem;
    }

    @media (max-width: 640px) {
        header {
            flex-direction: column;
            align-items: stretch;
        }

        header nav {
            justify-content: stretch;
        }

        header nav a,
        header nav button {
            flex: 1;
            justify-content: center;
            text-align: center;
        }

        .task-controls {
            flex-direction: column;
        }

        .control-group {
            min-width: unset;
        }
    }

    @media (min-width: 641px) and (max-width: 1024px) {
        .task-controls {
            gap: 1rem;
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
                <span class="sr-only">History</span>
            </a>
            <button 
                class="btn btn-outline" 
                onclick={() => showEditTask = true}
                aria-label="Edit task details"
            >
                <Edit/>
                <span class="sr-only">Edit</span>
            </button>
        </nav>
    </header>

    <section class="task-controls" aria-label="Task assignment and status controls">
        <fieldset class="control-group">
            <legend>
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
            <legend>
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