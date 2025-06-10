<script>
    import { Copy, X } from "@lucide/svelte";
    import { fade } from "svelte/transition";
    import { getResetToken } from "../../util/access-control";
    import Spinner from "../Spinner.svelte";
    
    /** @type {{ 
     *   userId: number,
     *   close: (() => void) | (() => Promise<void>),
     * }} */
    let { 
        userId,
        close,
    } = $props();

    let resetUrl = getResetToken(userId).then(token => `${window.location.origin}/resetpassword?token=${token}&userId=${userId}`);
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
        max-width: 28rem;
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
        margin: 0;
    }
    .reset-token {
        font-family: monospace;
        padding: 0.25rem 0.5rem;
        background-color: #ddd;
        overflow-wrap: break-word;
        border: 1px solid #0001;
        border-radius: 0.3rem;
    }
    .copy-button {
        float: right;
        position: relative;
        overflow: hidden;

        &:after {
            position: absolute;
            content: '';
            background-color: #fff6;
            left: 100%;
            top: -50%;
            width: 200%;
            height: 200%;
            transition-duration: 0.3s;
        }

        &:active:after {
            opacity: 0;
            left: -200%;
            transition: 0s;
        }
    }
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
</style>

<div transition:fade={{ duration: 150 }} class="modal-wrapper grey-zone" aria-hidden="true" onclick={close}>
    <dialog open onclick={e => e.stopPropagation()}>
        {#await resetUrl}
            <article>
                <section class="loader-wrapper">
                    <Spinner/>
                </section>
            </article>
        {:then resetUrl}
            <header class="modal-header">
                <h3 class="modal-title">Password Reset</h3>
                <button class="btn btn-small" onclick={close}>
                    <X class="full"/>
                </button>
            </header>
            <article>
                <p class="modal-message">
                    The user may reset their password with the following link:
                </p>
                <p class="reset-token">
                    <button class="btn btn-small copy-button" title="Copy Link" onclick={() => navigator.clipboard.writeText(resetUrl)}>
                        <Copy/>
                    </button>
                    {resetUrl}
                </p>
            </article>
        {:catch error}
            <header class="modal-header">
                <h3 class="modal-title">Password Reset</h3>
                <button class="btn btn-small" onclick={close}>
                    <X class="full"/>
                </button>
            </header>
            <article>
                <p class="modal-message error">
                    {error?.message || 'Failed to get password reset token.'}
                </p>
            </article>
        {/await}
    </dialog>
</div>
