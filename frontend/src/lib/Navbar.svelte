<script>
  import { fly } from "svelte/transition";
  import { ChevronDown, LogOut, X } from "@lucide/svelte/icons";
  import { userJwtContents } from "../util/stores";
  import { login, logout, register } from "../util/auth";
  import { LoginRequestSchema, RegisterRequestSchema } from "common";

  /**
   * @param {string} input
   */
  const hashSha256Hex = async (input) => {
    const inBuffer = new TextEncoder().encode(input);
    const outBuffer = await window.crypto.subtle.digest('SHA-256', inBuffer);
    return [...new Uint8Array(outBuffer)].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  const performLogin = async() => {
    const request = LoginRequestSchema.parse({
      email: 'luke.davis@bbd.co.za',
      password: 'abcd12345678',
      twoFactor: '953274',
    });
    const result = await login(request);
    console.log(result);
  };

  const performRegistration = async() => {
    const request = RegisterRequestSchema.parse({
      email: 'luke.davis@bbd.co.za',
      password: 'abcd12345678',
      name: 'Luke Davis',
    });
    const result = await register(request);
    console.log(result);
  };

  let showMenu = $state(false);
  let gravatarHashPromise = $derived($userJwtContents && window.crypto ? hashSha256Hex($userJwtContents.user.email.trim().toLowerCase()) : null);
</script>

<style>
  nav {
    display: flex;
    padding: 0.75rem 2rem;
    box-shadow: 0 0.5rem 0.5rem #0001;
    justify-content: space-between;
    align-items: center;

    .open-menu-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    img.profile-icon {
      width: 1.75rem;
      height: 1.75rem;
      border-radius: calc(1px * infinity);
    }

    .login-btns {
      display: flex;
      gap: 1rem;
    }
  }

  h1 {
    font-size: 1.75rem;
  }
  
  aside {
    background-color: #fafafa;
    box-shadow: -0.5rem 0 0.5rem #0001;
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 30;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;

    header {
      padding: 0.5rem;
      display: flex;
      gap: 2rem;
      font-size: 1rem;
      justify-content: space-between;
      align-items: center;
    }

    .profile-button {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .sidebar-close {
      font-size: 1.25rem;
    }

    .sidebar-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
  }
</style>

<nav>
  <h1>To-Do App</h1>
  <div>
    <!-- svelte-ignore block_empty -->
    {#await gravatarHashPromise}
    {:then gravatarHash} 
      {#if gravatarHash && $userJwtContents}
        <button class="open-menu-button" onclick={() => showMenu = true} aria-label="open menu">
          <ChevronDown/>
          <img class="profile-icon" src="https://gravatar.com/avatar/{gravatarHash}?d=identicon" alt={$userJwtContents.user.name}/>
        </button>
        {#if showMenu}
          <aside transition:fly={{ duration: 150, x: 150 }}>
            <header>
              <button class="profile-button" aria-label="close menu">
                <img class="profile-icon" src="https://gravatar.com/avatar/{gravatarHash}?d=identicon" alt={$userJwtContents.user.name}/>
                {$userJwtContents.user.name}
              </button>
              <button class="sidebar-close btn btn-small" onclick={() => showMenu = false}>
                <X/>
              </button>
            </header>
            <article class="sidebar-content">
              <button class="btn" onclick={() => logout()}>
                <LogOut/>
                Logout
              </button>
              <button class="btn" onclick={() => logout(true)}>
                <LogOut/>
                Logout from All Devices
              </button>
            </article>
          </aside>
        {/if}
      {:else}
        <div class="login-btns">
          <button class="btn" onclick={performLogin}>
            Sign In
          </button>
          <button class="btn btn-outline" onclick={performRegistration}>
            Register
          </button>
        </div>
      {/if}
    {/await}
  </div>
</nav>
