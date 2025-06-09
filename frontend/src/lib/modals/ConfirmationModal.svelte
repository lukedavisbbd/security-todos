<script>
    import { X } from "@lucide/svelte";
    import { fade } from "svelte/transition";
    import Spinner from "../Spinner.svelte";

    const tryClose = () => {
        if (!actionPromise) {
            close();
        }
    };
    const performAction = async () => {
        actionError = '';
        
        try {
            await onConfirm();
        } catch (error) {
            actionError = error.message || 'An error occurred while performing the action.';
        }
    };
    /** @type {{ 
     *   title: string,
     *   message: string,
     *   confirmText?: string,
     *   cancelText?: string,
     *   actionType?: 'danger' | 'primary',
     *   close: (() => void) | (() => Promise<void>), 
     *   onConfirm: (() => void) | (() => Promise<void>), 
     * }} */
    let { 
        title, 
        message, 
        confirmText = 'Confirm', 
        cancelText = 'Cancel',
        actionType = 'primary',
        close, 
        onConfirm 
    } = $props();
    
    /** @type {Promise<void> | null} */
    let actionPromise = $state(null);
    let actionError = $state('');
</script>

<style>
    dialog {
        position: absolute;
        border: none;
        background-color: #fafafa;
        box-shadow: 0 0.5rem 0.5rem #0001;
        position: absolute;
        z-index: 30;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        border-radius: 1rem;
        gap: 1.5rem;
        width: 100%;
        max-width: 24rem;
    }
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }
    .modal-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #333;
        margin: 0;
    }
    .modal-message {
        color: #555;
        line-height: 1.6;
        margin: 0;
    }
    .modal-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
    }
    .btn-confirm-primary {
        background-color: #007acc;
        color: white;
    }
    .btn-confirm-primary:enabled:hover {
        background-color: #005fa3;
        color: #eee;
    }
    .btn-confirm-danger {
        background-color: #c53030;
        color: white;
    }
    .btn-confirm-danger:enabled:hover {
        background-color: #9c2626;
        color: #eee;
    }
    .btn-confirm-primary:disabled,
    .btn-confirm-danger:disabled {
        background-color: #a0aec0;
        color: #718096;
        cursor: not-allowed;
    }
    .loader-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 0 auto;
        width: 100%;
        max-width: 8rem;
        aspect-ratio: 1;
        font-size: 3rem;
    }
    @media (max-width: 480px) {
        .modal-actions {
            flex-direction: column-reverse;
        }
    }
</style>

<div transition:fade={{ duration: 150 }} class="modal-wrapper grey-zone" aria-hidden="true" onclick={tryClose}>
    <dialog open onclick={e => e.stopPropagation()}>
        {#if actionPromise}
            <article>
                <section class="loader-wrapper">
                    <Spinner/>
                </section>
            </article>
        {:else}
            <header class="modal-header">
                <h3 class="modal-title">{title}</h3>
                <button class="btn btn-small" onclick={close}>
                    <X class="full"/>
                </button>
            </header>

            <article>
                <p class="modal-message">{message}</p>

                {#if actionError}
                    <p class="error">{actionError}</p>
                {/if}
            </article>

            <footer class="modal-actions">
                <button class="btn btn-outline" onclick={close}>
                    {cancelText}
                </button>
                <button 
                    class="btn btn-center"
                    class:btn-confirm-primary={actionType === 'primary'}
                    class:btn-confirm-danger={actionType === 'danger'}
                    onclick={() => actionPromise = performAction().then(() => { actionPromise = null })}
                >
                    {confirmText}
                </button>
            </footer>
        {/if}
    </dialog>
</div>
