<script>
  import { Search } from "@lucide/svelte";
  import { fetchRoles, searchUsers } from "../util/access-control";
  import Spinner from "../lib/Spinner.svelte";
  import UserCard from "../lib/UserCard.svelte";
  import { requireAdmin } from "../util/auth-guard";

  const authGuard = requireAdmin();
  const authState = $derived($authGuard);

  let search = $state('');
  let searchError = $state('');
  let users = $state([]);
  let usersLoading = $state(false);
  let allRoles = fetchRoles();

  $effect(() => {
    if (authState.isAuthorized) {
      (async (search) => {
        usersLoading = true;
        searchError = '';
        
        const newUsers = await searchUsers(search);
        if (newUsers && 'ok' in newUsers) {
          users = newUsers.ok;
        } else {
          users = [];
          searchError = 'Failed to search users.';
        }
        usersLoading = false;
      })(search);
    }
  });
</script>

<style>
  h1 {
    margin: 2rem;
    text-align: center;
  }

  p {
    margin: 1rem;
    text-align: center;
  }

  .loading-state {
    text-align: center;
    padding: 3rem 1rem;
    font-size: 2rem;
  }
</style>

<main>
  <article>
    {#if authState.isLoading}
      <div class="loading-state">
        <Spinner/>
      </div>
    {:else if authState.isAuthorized}
      <section class="inline-icon">
        <Search/>
        <label class="inline" for="search">Search</label>
        <input id="search" type="text" name="search" placeholder="" bind:value={search}>
      </section>
      <section>
        {#if usersLoading}
          <h1>
            <Spinner/>
          </h1>
        {:else if searchError}
          <p class="error">{searchError}</p>
        {:else}
          {#each users as user (user.user.userId)}
            <UserCard {user} {allRoles} onChangeRoles={(newRoles) => {
              user.roles = newRoles;
            }}/>
          {:else}
            <p>No users match the given search term.</p>
          {/each}
        {/if}
      </section>
    {/if}
  </article>
</main>