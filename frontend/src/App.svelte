<script>
  import { fade } from "svelte/transition";
  import Navbar from "./lib/Navbar.svelte";
  import { whoami } from "./util/auth";
  import { onMount } from "svelte";
  import { userJwtContents } from "./util/stores";

  onMount(() => {
    whoami();
    const interval = setInterval(() => {
      $userJwtContents && whoami()
    }, 60000);
    return () => clearInterval(interval);
  });
</script>

<style>
  .grey-zone {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-color: #0002;
    z-index: 20;
  }
</style>

<Navbar/>

<main>
  <article>
    <p>My todo app.</p>
  </article>
</main>

<!-- todo: show when modal active -->
{#if false}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div transition:fade={{ duration: 150 }} class="grey-zone" onclick={() => false}></div>
{/if}
