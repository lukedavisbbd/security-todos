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

  nav[role="banner"] {
    display: flex;
    padding: 0.75rem 2rem;
    box-shadow: 0 0.25rem 0.25rem #0001;
    justify-content: space-between;
    align-items: center;
    background: white;
    position: relative;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.75rem;
    font-weight: 600;
    color: inherit;
    text-decoration: none;
  }

  .brand:hover {
    color: inherit;
  }

  .user-actions {
    display: flex;
    align-items: center;
  }

  .profile-menu-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.375rem;
    transition: background-color 150ms;
  }

  .profile-menu-button:hover {
    background-color: #f5f5f5;
  }

  .auth-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  @media (max-width: 768px) {
    nav[role="banner"] {
      padding: 0.75rem 1rem;
    }

    .brand {
      font-size: 1.5rem;
    }

    .auth-actions {
      gap: 0.5rem;
    }
  }
</style>


<nav role="banner" aria-label="Main navigation">
  <a href="/" use:route class="brand" aria-label="To-Do App - Go to homepage">
    <NotebookPen aria-hidden="true"/>
    <span>To-Do</span>
  </a>
  
  <section class="user-actions">
    {#if $userJwtContents}
      <button 
        class="profile-menu-button" 
        onclick={() => showMenu = true} 
        aria-label="Open user menu for {$userJwtContents.user.name}"
        aria-expanded={showMenu}
        aria-haspopup="menu"
      >
        <ChevronDown aria-hidden="true"/>
        <ProfileLogo userId={$userJwtContents.user.userId} name={$userJwtContents.user.name}/>
      </button>
    {:else}
      <nav class="auth-actions" aria-label="Authentication">
        <button 
          class="btn" 
          onclick={() => showLogin = true}
          aria-label="Sign in to your account"
        >
          Sign In
        </button>
        <button 
          class="btn btn-outline" 
          onclick={() => showRegister = true}
          aria-label="Create new account"
        >
          Register
        </button>
      </nav>
    {/if}
  </section>
</nav>

{#if showLogin}
  <LoginModal close={() => showLogin = false}/>
{/if}
{#if showRegister}
  <RegisterModal close={() => showRegister = false}/>
{/if}
<Sidebar bind:showMenu/>