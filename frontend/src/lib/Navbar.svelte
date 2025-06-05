<script>
  import { fade, fly } from "svelte/transition";
  import { ChevronDown, LogOut, NotebookPen, X } from "@lucide/svelte/icons";
  import { userJwtContents } from "../util/stores";
  import { logout } from "../util/auth";
  import RegisterModal from "./modals/RegisterModal.svelte";
  import LoginModal from "./modals/LoginModal.svelte";
  import Spinner from "./Spinner.svelte";

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
  let initials = $derived(($userJwtContents?.user?.name ?? '').split(' ').map(n => n.substring(0, 1).toUpperCase()).join(''));
  let profileLogoSrc = $state('');

  /** @type {Promise | null} */
  let logoutPromise = $state(null);

  $effect(() => {
    (async () => {
      if ($userJwtContents && window.crypto) {
        const hash = await hashSha256Hex($userJwtContents.user.email.trim().toLowerCase());
        profileLogoSrc = `https://gravatar.com/avatar/${hash}?d=identicon`;
      } else {
        profileLogoSrc = '';
      }
    })()
  })
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
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: lightgrey;
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
      justify-content: space-between;
      align-items: center;
    }

    .profile-button {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      color: black;
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
    <a href="#">
      <NotebookPen/>
      To-Do
    </a>
  </h1>
  <div>
    {#if $userJwtContents}
      <button class="open-menu-button" onclick={() => showMenu = true} aria-label="open menu">
        <ChevronDown/>
        <img class="profile-icon" src={profileLogoSrc} alt={initials}/>
      </button>
      {#if showMenu}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div transition:fade={{ duration: 150 }} class="grey-zone" onclick={() => showMenu = false}>
          <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
          <aside transition:fly={{ duration: 150, x: 150 }} onclick={e => e.stopPropagation()}>
            <header>
              <button class="profile-button" aria-label="close menu">
                <img class="profile-icon" src={profileLogoSrc} alt={initials}/>
                {$userJwtContents.user.name}
              </button>
              <button class="sidebar-close btn btn-small" onclick={() => showMenu = false}>
                <X class="full"/>
              </button>
            </header>
            <article class="sidebar-content">
              {#if logoutPromise}
                <button class="btn" disabled>
                  <Spinner/>
                  Logout
                </button>
              {:else}
                <button class="btn" onclick={() => logoutPromise = logout().then(() => logoutPromise = null)}>
                  <LogOut/>
                  Logout
                </button>
              {/if}
              {#if logoutPromise}
                <button class="btn" disabled>
                  <Spinner/>
                  Logout from All Devices
                </button>
              {:else}
                <button class="btn" onclick={() => logoutPromise = logout(true).then(() => logoutPromise = null)}>
                  <LogOut/>
                  Logout from All Devices
                </button>
              {/if}
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
  </div>
</nav>

{#if showLogin}
  <LoginModal close={() => showLogin = false}/>
{/if}
{#if showRegister}
  <RegisterModal close={() => showRegister = false}/>
{/if}
