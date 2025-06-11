<script>
  import { X } from "@lucide/svelte";
  import { createEventDispatcher } from 'svelte';
  import { fade } from "svelte/transition";
  import Spinner from "../Spinner.svelte";
  import { TwoFactorSchema } from 'common';

  const dispatch = createEventDispatcher();
  let twoFactor = "";
  let error = null;
  let isLoading = false;

  function close() {
    dispatch('close');
  }

  const handleSubmit = async () => {
    error = null;
    const result = TwoFactorSchema.safeParse({twoFactor});
    if (!result.success) {
      error = result;
      return;
    }
    isLoading = true;
    dispatch('confirm', { twoFactor });
  };
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
</style>

<div
  transition:fade={{ duration: 150 }}
  class="modal-wrapper grey-zone"
  role="button"
  tabindex="0"
  on:click={close}
  on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && close()}
>
  <dialog
    open
    aria-modal="true"
    aria-label="Two-Factor Authentication"
    on:click|stopPropagation
  >
    {#if isLoading}
      <article>
        <div class="loader-wrapper">
          <Spinner />
        </div>
      </article>
    {:else}
      <header>
        Change Password
        <button type="button" class="btn btn-small" on:click={close}>
          <X class="full" />
        </button>
      </header>
      <form on:submit|preventDefault={handleSubmit}>
        <article>
          <div>
            <label class="inline" for="two-factor">2FA PIN</label>
            <input
              bind:value={twoFactor}
              type="text"
              id="two-factor"
              name="two-factor"
              placeholder="••••••"
              autocomplete="one-time-code webauthn"
              required
              minlength="6"
              maxlength="6"
              pattern="[0-9]{'{6}'}"
              class="two-factor"
            />
            {#if error?.properties?.twoFactor?.errors?.[0]}
              <p class="error">{error.properties.twoFactor.errors[0]}</p>
            {/if}
            {#if error?.errors?.[0]}
              <p class="error">{error.errors[0]}</p>
            {/if}
          </div>
        </article>
        <footer>
          <button type="submit" class="btn btn-outline btn-dark btn-center w-full">
            Verify
          </button>
        </footer>
      </form>
    {/if}
  </dialog>
</div>
