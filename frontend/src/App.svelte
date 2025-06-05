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

<Navbar/>

<main>
  <article>
    <p>My todo app.</p>
  </article>
</main>
