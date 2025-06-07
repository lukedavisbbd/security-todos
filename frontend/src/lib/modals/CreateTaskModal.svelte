<script>
    import { X } from "@lucide/svelte";
    import { fade } from "svelte/transition";
    import Spinner from "../Spinner.svelte";
    import { CreateTaskSchema } from "common";
    import { createTask } from "../../util/tasks";
    import { z } from "zod/v4";

    /**
     * @param {MouseEvent | KeyboardEvent} e
     */
    const tryClose = (e) => {
        if (e instanceof KeyboardEvent && e.key != 'Escape') {
            return;
        }
        if (!createPromise) {
            close();
        }
    };

    const performCreateTask = async () => {
        createErrors = null;
        const request = CreateTaskSchema.safeParse({
            teamId,
            assignedToId: assignedToId || undefined,
            statusId: Number(statusId),
            name: taskName,
            content: taskContent || undefined,
        });
        if (request.error) {
            createErrors = z.treeifyError(request.error);
            return;
        }
        const result = await createTask(request.data);

        if (!result) {
            createErrors = {
                errors: ['Failed to create task.'],
            };
            return;
        }
        
        if ('ok' in result) {
            onTaskCreated(result.ok);
            close();
        } else {
            createErrors = /** @type {{ errors?: string[], properties?: any } | null} */(
                result.err.data
            );
        }
    };

    /** @type {{ 
     *   teamId: number,
     *   members: import('common').TeamMember[],
     *   statuses: Array<{ status_id: number, status_name: string }>,
     *   close: () => void, 
     *   onTaskCreated: (task: import('common').Task) => void 
     * }} */
    let { teamId, members, statuses, close, onTaskCreated } = $props();

    let taskName = $state("");
    let taskContent = $state("");
    let assignedToId = $state(null);
    let statusId = $state(statuses.find(s => s.status_name === 'todo')?.status_id || statuses[0]?.status_id || 1);
    
    /** @type {Promise<void> | null} */
    let createPromise = $state(null);
    /** @type {{ errors?: string[], properties?: any } | null} */
    let createErrors = $state(null);
</script>

<style>
    .loader-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 0 auto;
        width: 100%;
        max-width: 12rem;
        aspect-ratio: 1;
        font-size: 4rem;
    }

    select {
        display: block;
        padding: 0.3rem 0.75rem;
        border: 1px solid #0003;
        border-radius: 0.3rem;
        width: 100%;
        background-color: white;
        font-size: inherit;
        font-family: inherit;
    }

    textarea {
        display: block;
        padding: 0.3rem 0.75rem;
        border: 1px solid #0003;
        border-radius: 0.3rem;
        width: 100%;
        min-height: 4rem;
        resize: vertical;
        font-family: inherit;
        font-size: inherit;
    }
</style>

<div transition:fade={{ duration: 150 }} class="modal-wrapper grey-zone" aria-hidden="true" onclick={tryClose} onkeydown={tryClose}>
    <dialog open onclick={e => e.stopPropagation()}>
        {#if createPromise}
            <article>
                <div class="loader-wrapper">
                    <Spinner/>
                </div>
            </article>
        {:else}
            <header>
                Create Task
                <button class="btn btn-small" onclick={close}>
                    <X class="full"/>
                </button>
            </header>
            <form onsubmit={e => {
                
                e.preventDefault();
                createPromise = performCreateTask().then(() => {
                    createPromise = null;
                });
            }}>
                <article>
                    {#if createErrors?.errors?.at(0)}
                        <p class="error">{createErrors.errors[0]}</p>
                    {/if}
                    <div>
                        <label class="inline" for="task-name">Task Name</label>
                        <input
                            bind:value={taskName} type="text" name="task-name" id="task-name"
                            placeholder="" required maxlength="32"
                        >
                        {#if createErrors?.properties?.name?.errors?.at(0)}
                            <p class="error">{createErrors.properties.name.errors[0]}</p>
                        {/if}
                    </div>
                    <div>
                        <label for="task-content">Description (optional)</label>
                        <textarea
                            bind:value={taskContent} name="task-content" id="task-content"
                            placeholder="Enter task description..." maxlength="255"
                        ></textarea>
                        {#if createErrors?.properties?.content?.errors?.at(0)}
                            <p class="error">{createErrors.properties.content.errors[0]}</p>
                        {/if}
                    </div>
                    <div>
                        <label for="assigned-to">Assign To</label>
                        <select bind:value={assignedToId} name="assigned-to" id="assigned-to">
                            <option value={null}>Unassigned</option>
                            {#each members as member (member.user_id)}
                                <option value={member.user_id}>{member.name}</option>
                            {/each}
                        </select>
                        {#if createErrors?.properties?.assignedToId?.errors?.at(0)}
                            <p class="error">{createErrors.properties.assignedToId.errors[0]}</p>
                        {/if}
                    </div>
                    <div>
                        <label for="status">Status</label>
                        <select bind:value={statusId} name="status" id="status" required>
                            {#each statuses as status (status.status_id)}
                                <option value={status.status_id}>{status.status_name}</option>
                            {/each}
                        </select>
                        {#if createErrors?.properties?.statusId?.errors?.at(0)}
                            <p class="error">{createErrors.properties.statusId.errors[0]}</p>
                        {/if}
                    </div>
                </article>
                <footer>
                    <button class="btn btn-outline btn-dark btn-center w-full">
                        Create Task
                    </button>
                </footer>
            </form>
        {/if}
    </dialog>
</div>