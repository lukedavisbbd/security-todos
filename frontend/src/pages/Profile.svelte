<script>
  import ProfileLogo from '../lib/ProfileLogo.svelte';
  import Spinner from '../lib/Spinner.svelte';
  import { userJwtContents } from '../util/stores';
  import { updateUserName } from '../util/user';
  import { UpdateUserNameSchema } from 'common';
  import { z } from 'zod/v4';
  import { ApiError, apiFetch } from '../util/http';
  import { whoami } from '../util/auth';
  
  let user = $userJwtContents?.user;
  if (!user) throw new Error();

  let nameForm = $state({
    name: user.name,
    isSubmitting: false,
    /** @type {{ errors?: string[], properties?: any } | null} */
    errors: null
  });

  let emailMessage = '';
  let emailError = '';
  let email2fa;

  async function handleEmailUpdate(e) {
    e.preventDefault();
    emailMessage = '';
    emailError = '';
    const form = e.target;
    const email = form.email.value.trim();
    const twoFactor = form.email2fa.value.trim();
    try {
      await apiFetch(`/users/${user?.userId}/email`, 'PUT', { email, twoFactor });
      emailMessage = 'Email updated successfully.';
      // Refresh user info
      const jwt = await whoami();
      userJwtContents.set(jwt);
      user = jwt.user;
      email2fa = '';
    } catch (err) {
      emailError = err?.errorResponse?.message || err.message || 'Failed to update email.';
    }
  }
</script>

<main>
  <header>
    <ProfileLogo email={user.email} name={user.name}/>
    <section>
      <h3>{user.name}</h3>
      <p>
        {user.email}
        {#if user.emailVerified}
          <span class="verified">
            (Verified)
          </span>
        {:else}
          <span class="not-verified">
            (Not Verified)
          </span>
        {/if}
      </p>
    </section>
  </header>
  <article>
    <p class="profile-picture-source">Your profile picture is sourced from <a href="https://gravatar.com/" target="_blank">Gravatar</a>.</p>
    <h5>Personal Details</h5>
      {#if emailMessage}
      <p class="success">{emailMessage}</p>
      {/if}
      {#if emailError}
        <p class="error">{emailError}</p>
      {/if}
    <form onsubmit={async (e) => {
      e.preventDefault();
      
      nameForm.isSubmitting = true;
      nameForm.errors = null;
      
      const request = UpdateUserNameSchema.safeParse({
        name: nameForm.name,
      });
      
      if (request.error) {
        nameForm.errors = z.treeifyError(request.error);
        nameForm.isSubmitting = false;
        return;
      }
      
      try {
        await updateUserName(request.data.name);
        user.name = request.data.name;
        nameForm.isSubmitting = false;
      } catch (err) {
        nameForm.isSubmitting = false;
        if (err instanceof ApiError && err.errorResponse.code === 'validation_error') {
          nameForm.errors = err.errorResponse.data;
        } else {
          nameForm.errors = {
            errors: [err?.message || 'Failed to update name.']
          };
        }
      }
    }}>
      <section class="form-group">
        <label for="name" class="inline">Name</label>
        <input 
          type="text" 
          name="name" 
          id="name" 
          placeholder="" 
          bind:value={nameForm.name}
          minlength="1" 
          maxlength="64" 
          required
          disabled={nameForm.isSubmitting}
        >
        {#if nameForm.errors?.errors?.at(0)}
          <p class="error">{nameForm.errors.errors[0]}</p>
        {/if}
        {#if nameForm.errors?.properties?.name?.errors?.at(0)}
          <p class="error">{nameForm.errors.properties.name.errors[0]}</p>
        {/if}
      </section>
      <section class="button-group">
        <button class="btn btn-dark" disabled={nameForm.isSubmitting}>
          {#if nameForm.isSubmitting}
            <Spinner/>
            Updating...
          {:else}
            Update Name
          {/if}
        </button>
      </section>
    </form>
    <form onsubmit={handleEmailUpdate}>
      <section class="form-group">
        <label for="email" class="inline">Email Address</label>
        <input type="email" name="email" id="email" placeholder="" min="1" maxlength="128" required value={user?.email}>
      </section>
      <section class="form-group">
        <label for="email2fa" class="inline">2FA Code</label>
        <input type="text" name="email2fa" id="email2fa" placeholder="" minlength="6" maxlength="6" required bind:value={email2fa}>
      </section>
      <section class="button-group">
        <button class="btn btn-dark">Update Email</button>
      </section>

    </form>
    <h5>Change Password</h5>
    <form onsubmit={e => e.preventDefault()}>
      <section class="form-group">
        <label for="password" class="inline">Old Password</label>
        <input type="password" name="password" id="password" placeholder="" min="1" maxlength="128" required>
      </section>
      <section class="form-group">
        <label for="new-password" class="inline">New Password</label>
        <input type="password" name="new-password" id="new-password" placeholder="" min="1" maxlength="128" required>
      </section>
      <section class="button-group">
        <button class="btn btn-dark">Change Password</button>
      </section>
    </form>
  </article>
</main>

<style>
  main {
    margin-top: 1rem;
    margin-bottom: 1rem;
  }

  header {
    display: flex;
    align-items: center;
    gap: 1rem;

    h3 {
      line-height: 1;
    }

    p {
      display: flex;
      flex-wrap: wrap;
      column-gap: 0.25rem;
      color: #333;

      .verified {
        color: limegreen;
      }

      .not-verified {
        color: red;
      }
    }

    :global(img) {
      width: 4rem;
      height: 4rem;
    }
  }

  .profile-picture-source {
    color: #666;
  }

  article {
    margin: 1rem 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;

    h5 {
      margin: 0 0.1rem;
    }

    form {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      
      .form-group {
        flex: calc(infinity);
        min-width: 16rem;
      }
      
      .button-group {
        display: flex;
        flex: 1;
        min-width: 10rem;
        justify-content: end;
      }
      
      button {
        width: 100%;
        justify-content: center;
        padding: 0.875rem;
      }
    }
  }

  .success { color: limegreen; }
  .error { color: red; }
</style>
