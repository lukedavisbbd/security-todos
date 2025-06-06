<script>
  import { whoami } from "./util/auth";
  import { onMount } from "svelte";
  import { userJwtContents } from "./util/stores";
  import Home from "./pages/Home.svelte";
  import { Router } from "@mateothegreat/svelte5-router";
  import AccessControl from "./pages/AccessControl.svelte";
  import Navbar from "./lib/Navbar.svelte";

  onMount(() => {
    whoami();
    
    const interval = setInterval(() => {
      $userJwtContents && whoami()
    }, 60000);
    
    return () => clearInterval(interval);
  });

  /** @type {import('@mateothegreat/svelte5-router').RouteConfig[]} */
  const routes = [
    {
      component: Home,
    },
    {
      path: "/access",
      component: AccessControl,
    },
  ];
</script>

<Navbar/>

<Router {routes}/>