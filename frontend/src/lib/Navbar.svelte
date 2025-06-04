<script>
  import { fade, fly } from "svelte/transition";
  import { ChevronDown, LogOut, NotebookPen, UserLock, X } from "@lucide/svelte/icons";
  import { userJwtContents } from "../util/stores";
  import { logout } from "../util/auth";
  import RegisterModal from "./modals/RegisterModal.svelte";
  import LoginModal from "./modals/LoginModal.svelte";
  import { route } from "@mateothegreat/svelte5-router";

  /**
   * @param {string} input
   */
  const hashSha256Hex = async (input) => {
    const inBuffer = new TextEncoder().encode(input);
    const outBuffer = await window.crypto.subtle.digest('SHA-256', inBuffer);
    return [...new Uint8Array(outBuffer)].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  let showMenu = $state(false);
  let showLogin = $state(false);
  let showRegister = $state(false);
  let gravatarHashPromise = $derived($userJwtContents && window.crypto ? hashSha256Hex($userJwtContents.user.email.trim().toLowerCase()) : null);
</script>

<style>
  nav {
    display: flex;
    padding: 0.75rem 2rem;
    box-shadow: 0 0.5rem 0.5rem #0001;
    justify-content: space-between;
    align-items: center;

    > h1 a {
      color: inherit;
    }

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
    gap: 0.25rem;

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
  <h1>
    <a href="/" use:route>
      <NotebookPen/>
      To-Do
    </a>
  </h1>
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
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div transition:fade={{ duration: 150 }} class="grey-zone" onclick={() => showMenu = false}>
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <aside transition:fly={{ duration: 150, x: 150 }} onclick={e => e.stopPropagation()}>
              <header>
                <button class="profile-button" aria-label="close menu">
                  <img class="profile-icon" src="https://gravatar.com/avatar/{gravatarHash}?d=identicon" alt={$userJwtContents.user.name}/>
                  {$userJwtContents.user.name}
                </button>
                <button class="sidebar-close btn btn-small" onclick={() => showMenu = false}>
                  <X class="full"/>
                </button>
              </header>
              <article class="sidebar-content">
                {#if $userJwtContents.roles.some(role => role == 'access_admin') }
                  <a class="btn" href="/access" use:route>
                    <UserLock/>
                    Access Control
                  </a>
                {/if}
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
          </div>
        {/if}
      {:else}
        <div class="login-btns">
          <button class="btn" onclick={() => showLogin = true}>
            Sign In
          </button>
          <button class="btn btn-outline" onclick={() => showRegister = true}>
            Register
          </button>
        </div>
      {/if}
    {/await}
  </div>
</nav>

{#if showLogin}
  <LoginModal close={() => showLogin = false}/>
{/if}
{#if showRegister}
  <RegisterModal close={() => showRegister = false}/>
{/if}
