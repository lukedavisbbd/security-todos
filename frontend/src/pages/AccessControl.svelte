<script>
  import { Search } from "@lucide/svelte";
  import { fetchRoles, searchUsers } from "../util/access-control";
  import Spinner from "../lib/Spinner.svelte";
  import UserCard from "../lib/UserCard.svelte";

  let search = $state('');
  let searchError = $state('');
  let users = $state([]);
  let usersLoading = $state(false);
  let allRoles = fetchRoles();

  $effect(() => {
    (async (search) => {
      usersLoading = true;
      const newUsers = await searchUsers(search);
      if (newUsers && 'ok' in newUsers)
        users = newUsers.ok;
      else {
        users = [];
        searchError = 'Failed to search users.';
      }
      usersLoading = false;
    })(search)
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
</style>

<main>
  <article>
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
  </article>
</main>
