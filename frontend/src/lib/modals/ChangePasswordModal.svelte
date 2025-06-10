<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import { Eye, EyeOff, X } from '@lucide/svelte';
  import Spinner from '../Spinner.svelte';
  import { ChangePasswordRequestSchema } from 'common';
  import { changePassword } from '../../util/user';
  import { pwnedPasswordCount } from '../../util/auth';
  
  const dispatch = createEventDispatcher();

  let oldPassword = '';
  let newPassword = '';
  let newPasswordConfirm = '';
  let twoFactor = '';
  let showPassword = false;

  let pending: Promise<void> | null = null;
  let errors: Record<string, string[]> = {};

  let breachCount = 0;
  let checkingBreach = false;

  $: if (newPassword) {
    checkingBreach = true;
    pwnedPasswordCount(newPassword)
      .then((count) => breachCount = count)
      .catch((err) => {
        console.error('Breach check failed', err);
        breachCount = 0;
      })
      .finally(() => checkingBreach = false);
  } else {
    breachCount = 0;
  }

  function close() {
    dispatch('close');
  }

  async function submit() {
    errors = {};

    const parsed = ChangePasswordRequestSchema.safeParse({ oldPassword, newPassword, twoFactor });
    if (!parsed.success) {
      errors = parsed.error.flatten().fieldErrors as any;
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      errors.confirm = ['Passwords do not match.'];
      return;
    }

    if (breachCount > 0) {
      errors.newPassword = [`Appears in ${breachCount} breaches.`];
      return;
    }

    pending = changePassword({ oldPassword, newPassword, twoFactor })
      .then(() => close())
      .catch((err) => {
        if (err?.errorResponse?.data?.errors) {
          errors.general = err.errorResponse.data.errors;
        } else {
          console.error(err);
        }
      })
      .finally(() => pending = null);
  }
</script>

<div
  class="modal-backdrop"
  role="button"
  tabindex="0"
  transition:fade
  on:click={close}
  on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && close()}
>
  <dialog on:click|stopPropagation>
    <button
      class="close-btn"
      type="button"
      aria-label="Close modal"
      on:click={close}
    >
      <X />
    </button>
    <h2>Change Password</h2>

    <form on:submit|preventDefault={submit}>
      <div class="field">
        <label for="old-password">Current Password</label>
        <input id="old-password" type="password" bind:value={oldPassword} minlength="12" maxlength="128" required />
        {#if errors.oldPassword}
          <p class="error">{errors.oldPassword[0]}</p>
        {/if}
      </div>

      <div class="field password-field">
        <label for="new-password">New Password</label>
        <input
          id="new-password"
          type={showPassword ? 'text' : 'password'}
          bind:value={newPassword}
          minlength="12"
          maxlength="128"
          autocomplete="new-password"
          required
        />
        <button
          type="button"
          class="toggle"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          on:click={() => showPassword = !showPassword}
        >
          {#if showPassword}<EyeOff />{:else}<Eye />{/if}
        </button>
        {#if checkingBreach}<p>Checking password…</p>
        {:else if breachCount > 0}<p class="error">Appears in {breachCount} breaches.</p>{/if}
        {#if errors.newPassword}<p class="error">{errors.newPassword[0]}</p>{/if}
      </div>

      <div class="field">
        <label for="confirm-password">Confirm New Password</label>
        <input id="confirm-password" type="password" bind:value={newPasswordConfirm} minlength="12" maxlength="128" required />
        {#if errors.confirm}<p class="error">{errors.confirm[0]}</p>{/if}
      </div>

      <div class="field">
        <label for="two-factor">2FA Code</label>
        <input id="two-factor" type="text" bind:value={twoFactor} pattern="\d{6}" maxlength="6" required />
        {#if errors.twoFactor}<p class="error">{errors.twoFactor[0]}</p>{/if}
      </div>

      {#if errors.general}<p class="error">{errors.general[0]}</p>{/if}

      <button class="btn" type="submit" disabled={!!pending}>
        {#if pending}<Spinner />{:else}Change Password{/if}
      </button>
    </form>
  </dialog>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  dialog {
    position: relative;
    border: none;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    background: #fff;
    width: 90%;
    max-width: 400px;
  }

  .close-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
  }

  .field {
    margin-bottom: 1rem;
  }

  .password-field {
    position: relative;
  }

  .password-field .toggle {
    position: absolute;
    right: 0.5rem;
    top: 2.2rem;
    background: none;
    border: none;
    cursor: pointer;
  }

  .error {
    color: var(--error);
    font-size: 0.9rem;
    margin-top: 0.25rem;
  }
</style>
