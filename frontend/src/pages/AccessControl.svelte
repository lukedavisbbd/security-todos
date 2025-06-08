<script>
  import { Search } from "@lucide/svelte";
  import { fetchRoles, searchUsers } from "../util/access-control";
  import Spinner from "../lib/Spinner.svelte";
  import UserCard from "../lib/UserCard.svelte";

  let search = $state('');
  let users = $derived(searchUsers(search));
  let allRoles = fetchRoles();
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
  <section class="inline-icon">
    <Search/>
    <label class="inline" for="search">Search</label>
    <input id="search" type="text" name="search" placeholder="" bind:value={search}>
  </section>
  <section>
    {#await Promise.all([users, allRoles])}
      <h1>
        <Spinner/>
      </h1>
    {:then [users, allRoles]}
      {#each users as user (user.user.userId)}
        <UserCard {user} {allRoles} onChangeRoles={(newRoles) => {
          user.roles = newRoles;
        }}/>
      {:else}
        <p>No users match the given search term.</p>
      {/each}
    {:catch}
      <p class="error">Failed to search for users.</p>
    {/await}
  </section>
</main>