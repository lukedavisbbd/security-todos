<script>
  import { goto, query } from '@mateothegreat/svelte5-router';
  import OtpEntryModal from '../lib/modals/OtpEntryModal.svelte';
  import { pwnedPasswordCount, resetPassword } from '../util/auth';
  import { ResetPasswordRequestSchema } from 'common';
  import { z } from 'zod/v4';
  import { ApiError } from '../util/http';
  import Spinner from '../lib/Spinner.svelte';
  import { Eye, EyeOff } from '@lucide/svelte';

  /**
   * @param {Event | undefined} e
   */
  const submitForm = (e = undefined) => {
    e?.preventDefault();

    passwordErrors = null;
    showTwoFactor = false;

    if (password.trim() != passwordConfirm.trim()) {
      passwordErrors = {
        errors: [],
        properties: {
          newPassword: {
            errors: ['Passwords do not match!'],
          }
        },
      };
      twoFactor = '';
      return;
    }
    
    if (twoFactor.length < 6) {
      twoFactor = '';
      showTwoFactor = true;
      return;
    }

    const result = ResetPasswordRequestSchema.safeParse({
      resetToken,
      newPassword: password,
      twoFactor,
    });

    twoFactor = '';
    
    if (!result.success) {
      passwordErrors = z.treeifyError(result.error);
      return;
    }
    
    passwordPromise = performResetPassword(result.data).then(() => { passwordPromise = null });
  }

  /** @param {import('common').ResetPasswordRequest} request */
  const performResetPassword = async (request) => {
    try {
      await resetPassword(userId, request);
      goto('/');
    } catch (err) {
      if (err instanceof ApiError && err.errorResponse.code === 'validation_error') {
        passwordErrors = err.errorResponse.data;
      } else {
        passwordErrors = {
          errors: err?.message || 'Failed to reset password.',
        };
      }
    }
  };
  
  const userId = parseInt(query('userId') ?? '');
  const resetToken = query('token') ?? '';
  
  if (!isFinite(userId))
    throw new Error('Invalid user ID');
  
  if (!resetToken)
    throw new Error('Invalid reset token');

  let password = $state('');
  let passwordConfirm = $state('');

  let pwnedPasswords = $derived(pwnedPasswordCount(password));

  let twoFactor = $state('');
  let showTwoFactor = $state(false);
  
  let showPassword = $state(false);

  /**
   * @type {Promise<void> | null}
  */
  let passwordPromise = $state(null);
  /**
   * @type {import('zod/v4/core').$ZodErrorTree<import('common').ResetPasswordRequest> | null}
  */
  let passwordErrors = $state(null);

  /** @type {HTMLFormElement} */
  // @ts-ignore
  let form = $state();
</script>

<main>
  <article>
    <h5>Reset Password</h5>
    <form bind:this={form} onsubmit={submitForm}>
      <section>
        <section class="password-wrapper">
          <label for="password" class="inline">New Password</label>
          <input bind:value={password} type={showPassword ? 'text' : 'password'} name="password" id="password" placeholder="" min="1" maxlength="128" required>
          <button type="button" class="show-password-button" onclick={(e) => {
            e.preventDefault();
            showPassword = !showPassword;
          }}>
            {#if showPassword}
              <EyeOff/>
            {:else}
              <Eye/>
            {/if}
          </button>
        </section>
      </section>
      <section>
        <label for="password-confirm" class="inline">Confirm New Password</label>
        <input bind:value={passwordConfirm} type="password" name="password-confirm" id="password-confirm" placeholder="" min="1" maxlength="128" required>
      </section>
      <section>
        {#if passwordErrors?.errors?.at(0)}
          <p class="error">{passwordErrors.errors[0]}</p>
        {/if}
        {#if passwordErrors?.properties?.resetToken?.errors?.at(0)}
          <p class="error">{passwordErrors.properties.resetToken.errors[0]}</p>
        {/if}
        {#if passwordErrors?.properties?.twoFactor?.errors?.at(0)}
          <p class="error">{passwordErrors.properties.twoFactor.errors[0]}</p>
        {/if}
        {#if passwordErrors?.properties?.newPassword?.errors?.at(0)}
          <p class="error">{passwordErrors.properties.newPassword.errors[0]}</p>
        {/if}
      </section>
      <section class="submit-button">
        {#await pwnedPasswords}
          <p class="checking-password">
            <Spinner/>
            Checking password...
          </p>
          <button class="btn btn-outline btn-dark btn-center w-full" disabled>
            Reset Password
          </button>
        {:then count}
          {#if count > 0}
            <p class="error password-warning">
              This password is not secure! It has been detected in
              {#if count == 1}
                a data breach!
              {:else}
                {count} data breaches!
              {/if}
            </p>
            <button class="btn btn-outline btn-dark btn-center w-full" disabled>
              Reset Password
            </button>
          {:else}
            {#if passwordPromise}
              {#await passwordPromise}
                <button class="btn btn-dark" disabled>
                  <Spinner/> Reset Password
                </button>
              {:then}
                <button class="btn btn-dark" disabled>
                  Reset Password
                </button>
              {/await}
            {:else}
              <button class="btn btn-dark">
                Reset Password
              </button>
            {/if}
          {/if}
        {/await}
      </section>
    </form>
  </article>
</main>

{#if showTwoFactor}
  <OtpEntryModal bind:twoFactor={twoFactor} onCancel={() => {
    showTwoFactor = false;
    twoFactor = '';
  }} onSubmit={submitForm}/>
{/if}

<style>
  main {
    margin-top: 10rem;
    margin-bottom: 2rem;

    @media (max-height: 48rem) {
      margin-top: 8rem;
    }

    @media (max-height: 32rem) {
      margin-top: 4rem;
    }

    @media (max-height: 24rem) {
      margin-top: 1rem;
    }
  }

  article {
    margin: 1rem auto;
    max-width: 24rem;

    h5 {
      margin: 0 0.1rem;
      margin-bottom: 1rem;
    }

    form {
      > section {
        margin-bottom: 0.5rem;
      }
      
      .submit-button button {
        width: 100%;
        margin-top: 1rem;
        justify-content: center;
      }
    }
  }

  .password-warning {
    margin-bottom: 1rem;
  }

  .checking-password {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: #666;
    margin-bottom: 1rem;

    :global(svg) {
      font-size: 1rem;
    }
  }

  .password-wrapper {
    position: relative;

    input {
      padding-right: 2rem;
    }
  }

  .show-password-button {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
  }
</style>
