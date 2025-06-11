<script>
  import { fade, fly } from "svelte/transition";
  import ProfileLogo from "./ProfileLogo.svelte";
  import { userJwtContents } from "../util/stores";
  import { Home, LogOut, User, UserLock, X } from "@lucide/svelte";
  import { goto, route } from "@mateothegreat/svelte5-router";
  import Spinner from "./Spinner.svelte";
  import { logout } from "../util/auth";

  /** @type {{ showMenu: boolean }} */
  let { showMenu = $bindable() } = $props();

  /** @type {Promise | null} */
  let logoutPromise = $state(null);
</script>

<style>
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

{#if showMenu && $userJwtContents}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div transition:fade|global={{ duration: 150 }} class="grey-zone" onclick={() => showMenu = false}>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <aside transition:fly|global={{ duration: 150, x: 150 }} onclick={e => e.stopPropagation()}>
      <header>
        <a class="profile-button" href="/profile" onclick={() => showMenu = false} use:route>
          <ProfileLogo userId={$userJwtContents.user.userId} name={$userJwtContents.user.name}/>
          {$userJwtContents.user.name}
        </a>
        <button class="sidebar-close btn btn-small" onclick={() => showMenu = false} aria-label="close menu">
          <X class="full"/>
        </button>
      </header>
      <article class="sidebar-content">
        <a class="btn" href="/" onclick={() => showMenu = false} use:route>
          <Home/>
          Home
        </a>
        {#if $userJwtContents.roles.some(role => role == 'access_admin') }
          <a class="btn" href="/access" onclick={() => showMenu = false} use:route>
            <UserLock/>
            Access Control
          </a>
        {/if}
        {#if logoutPromise}
          <button class="btn" disabled>
            <Spinner/>
            Logout
          </button>
        {:else}
          <button class="btn" onclick={() => logoutPromise = logout().then(() => {
            logoutPromise = null;
            goto('/');
          })}>
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
          <button class="btn" onclick={() => logoutPromise = logout(true).then(() => {
            logoutPromise = null;
            goto('/');
          })}>
            <LogOut/>
            Logout from All Devices
          </button>
        {/if}
      </article>
    </aside>
  </div>
{/if}
