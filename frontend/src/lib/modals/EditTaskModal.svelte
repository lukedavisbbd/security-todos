<script>
    import { X } from "@lucide/svelte";
    import { fade } from "svelte/transition";
    import Spinner from "../Spinner.svelte";
    import { UpdateTaskDetailsSchema } from "common";
    import { updateTaskDetails } from "../../util/tasks";
    import { z } from "zod/v4";
    import { ApiError } from "../../util/http";

    const tryClose = () => {
        if (!updatePromise) {
            close();
        }
    };

    const performUpdateTask = async () => {
        updateErrors = null;
        
        // Check if anything actually changed
        if (taskName === task.taskName && taskContent === (task.taskContent || '')) {
            close();
            return;
        }

        const request = UpdateTaskDetailsSchema.safeParse({
            name: taskName,
            content: taskContent,
        });

        if (request.error) {
            updateErrors = z.treeifyError(request.error);
            return;
        }

        try {
            await updateTaskDetails(task.taskId, request.data.name, request.data.content);
            onTaskUpdated();
            close();
        } catch (err) {
            if (err instanceof ApiError && err.errorResponse.code === 'validation_error') {
                updateErrors = /** @type {{ errors?: string[], properties?: any } | null} */(
                    err.errorResponse.data
                );
            } else {
                updateErrors = {
                    errors: ['Failed to update task.']
                };
            }
        }
    };

    /** @type {{ 
     *   task: import('common').Task,
     *   close: () => void, 
     *   onTaskUpdated: () => void 
     * }} */
    let { task, close, onTaskUpdated } = $props();

    // Initialize form values from task
    let taskName = $state(task.taskName);
    let taskContent = $state(task.taskContent || '');
    
    /** @type {Promise<void> | null} */
    let updatePromise = $state(null);
    /** @type {{ errors?: string[], properties?: any } | null} */
    let updateErrors = $state(null);
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

<div transition:fade={{ duration: 150 }} class="modal-wrapper grey-zone" aria-hidden="true" onclick={tryClose}>
    <dialog open onclick={e => e.stopPropagation()}>
        {#if updatePromise}
            <article>
                <div class="loader-wrapper">
                    <Spinner/>
                </div>
            </article>
        {:else}
            <header>
                Edit Task Details
                <button class="btn btn-small" onclick={close}>
                    <X class="full"/>
                </button>
            </header>
            <form onsubmit={e => {
                e.preventDefault();
                updatePromise = performUpdateTask().then(() => {
                    updatePromise = null;
                });
            }}>
                <article>
                    {#if updateErrors?.errors?.at(0)}
                        <p class="error">{updateErrors.errors[0]}</p>
                    {/if}
                    <div>
                        <label class="inline" for="task-name">Task Name</label>
                        <input
                            bind:value={taskName} type="text" name="task-name" id="task-name"
                            placeholder="" required maxlength="32"
                        >
                        {#if updateErrors?.properties?.name?.errors?.at(0)}
                            <p class="error">{updateErrors.properties.name.errors[0]}</p>
                        {/if}
                    </div>
                    <div>
                        <label for="task-content">Description</label>
                        <textarea
                            bind:value={taskContent} name="task-content" id="task-content"
                            placeholder="Enter task description..." maxlength="255"
                        ></textarea>
                        {#if updateErrors?.properties?.content?.errors?.at(0)}
                            <p class="error">{updateErrors.properties.content.errors[0]}</p>
                        {/if}
                    </div>
                </article>
                <footer>
                    <button class="btn btn-outline btn-dark btn-center w-full">
                        Update Task
                    </button>
                </footer>
            </form>
        {/if}
    </dialog>
</div>