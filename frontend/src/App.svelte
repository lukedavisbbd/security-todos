<script>
  import { checkAuth, whoami } from "./util/auth";
  import { onMount } from "svelte";
  import { userJwtContents } from "./util/stores";
  import Home from "./pages/Home.svelte";
  import TeamDetail from "./pages/TeamDetail.svelte";
  import TaskHistory from "./pages/TaskHistory.svelte";
  import { goto, Router } from "@mateothegreat/svelte5-router";
  import AccessControl from "./pages/AccessControl.svelte";
  import Navbar from "./lib/Navbar.svelte";
  import Spinner from "./lib/Spinner.svelte";
  import ResetPassword from "./pages/ResetPassword.svelte";

  let authPromise = checkAuth();

  onMount(() => {
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
      path: "/team/(?<teamId>.*)",
      component: TeamDetail,
    },
    {
      path: "/history/(?<taskId>.*)",
      component: TaskHistory,
    },
    {
      path: "/resetpassword",
      component: ResetPassword,
    },
    {
      path: "/access",
      component: AccessControl,
      hooks: {
        pre: () => {
          const allowed = $userJwtContents?.roles.includes('access_admin');
          if (!allowed) {
            goto('/');
          }
          return allowed;
        },
      },
    },
  ];
</script>

<style>
  .loading {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 5rem;
  }
</style>

{#await authPromise}
  <main class="loading">
    <Spinner/>
  </main>
{:then}
  <Navbar/>
  <Router {routes}/>
{/await}