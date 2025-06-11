<script>
  import { X } from "@lucide/svelte";
  import { fade } from "svelte/transition";

  const { open = false, onCodeSubmit, loading, onClose } = $props();
  let code = $state('');

  function handleSubmit(e) {
    e.preventDefault();
    onCodeSubmit(code);
    code = '';
  }
</script>

{#if open}
<div transition:fade={{ duration: 150 }} class="modal-wrapper grey-zone" aria-hidden="true">
    <dialog open>
        <header>
            2FA Code
            <button class="btn btn-small" onclick={onClose}>
                <X class="full"/>
            </button>
        </header>

        <form onsubmit={handleSubmit}>
            <input name="two-factor" id="two-factor" class="two-factor" type="text" bind:value={code} maxlength="6" minlength="6" required placeholder="••••••" autocomplete="one-time-code webauthn" />
            <div class="actions">
            <button class="btn btn-outline btn-dark btn-center w-full" disabled={loading || code.length !== 6}>
                {#if loading}Updating...{:else}Submit{/if}
            </button>
            </div>
        </form>
    </dialog>
</div>
{/if}