<script>
  import { ChevronDown, NotebookPen } from "@lucide/svelte/icons";
  import { userJwtContents } from "../util/stores";
  import RegisterModal from "./modals/RegisterModal.svelte";
  import LoginModal from "./modals/LoginModal.svelte";
  import { route } from "@mateothegreat/svelte5-router";
  import ProfileLogo from "./ProfileLogo.svelte";
  import Sidebar from "./Sidebar.svelte";

  let showMenu = $state(false);
  let showLogin = $state(false);
  let showRegister = $state(false);
</script>

<style>
  nav {
    display: flex;
    padding: 0.75rem 2rem;
    box-shadow: 0 0.25rem 0.25rem #0001;
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

    .login-btns {
      display: flex;
      gap: 1rem;
    }
  }

  h1 {
    font-size: 1.75rem;
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
    {#if $userJwtContents}
      <button class="open-menu-button" onclick={() => showMenu = true} aria-label="open menu">
        <ChevronDown/>
        <ProfileLogo email={$userJwtContents.user.email} name={$userJwtContents.user.name}/>
      </button>
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
<Sidebar bind:showMenu/>
