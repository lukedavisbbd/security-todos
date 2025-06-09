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
</style>

<article>
    <header>
        <h5>{task.taskName}</h5>
        <section>
            <a
                class="btn btn-outline" 
                href="/history/{task.taskId}"
                use:route
            >
                <History/>
                History
            </a>
            <button 
                class="btn btn-outline" 
                title="Edit Task Details"
                onclick={() => showEditTask = true}
            >
                <Edit/>
                Edit
            </button>
        </section>
    </header>

    <section class="actions">
        <section>
            <label class="label" for="assigned-{task.taskId}">
                Assigned to:
                {#if assignLoading}
                    <Spinner/>
                {/if}
            </label>
            <select 
                id="assigned-{task.taskId}"
                bind:value={task.assignedToId}
                onchange={() => assignTask(task)}
            >
                <option value={null}>Unassigned</option>
                {#each members as member (member.userId)}
                    <option value={member.userId}>{member.name}</option>
                {/each}
            </select>
            {#if assignError}
                <p class="error">
                    {assignError}
                </p>
            {/if}
        </section>
        <section>
            <label class="label" for="status-{task.taskId}">
                Status:
                {#if statusLoading}
                    <Spinner/>
                {/if}
            </label>
            <select
                id="status-{task.taskId}"
                class="status-select"
                bind:value={task.statusId}
                onchange={() => updateStatus(task)}
            >
                {#each allStatuses as status (status.statusId)}
                    <option value={status.statusId}>{status.statusName}</option>
                {/each}
            </select>
            {#if statusError}
                <p class="error">
                    {statusError}
                </p>
            {/if}
        </section>
    </section>

    {#if task.taskContent}
        <section>
            <p class="label">Description:</p>
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
