<script>
  import { Search } from "@lucide/svelte";
  import { fetchRoles, searchUsersFull, timeoutPromise } from "../util/access-control";
  import Spinner from "../lib/Spinner.svelte";
  import UserCard from "../lib/UserCard.svelte";

  let search = $state('');
  let usersPromise = $derived(search.trim().length >= 2 ? timeoutPromise(300).then(() => searchUsersFull(search.trim())) : Promise.resolve(null));
  let allRolesPromise = fetchRoles();
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

  .search-hint {
      padding: 1rem;
      text-align: center;
      color: #999;
      font-size: 0.875rem;
  }
</style>

<main>
  <section class="inline-icon">
    <Search/>
    <label class="inline" for="search">Search</label>
    <input id="search" type="text" name="search" placeholder="" maxlength="256" bind:value={search}>
  </section>
  <section>
    {#await Promise.all([usersPromise, allRolesPromise])}
      <h1>
        <Spinner/>
      </h1>
    {:then [users, allRoles]}
      {#if users === null}
        <div class="search-hint">
          Enter at least 2 characters to search for users
        </div>
      {:else}
        {#each users as user (user.user.userId)}
          <UserCard {user} {allRoles} onChangeRoles={(newRoles) => {
            user.roles = newRoles;
            usersPromise = Promise.resolve(users);
          }}/>
        {:else}
          <p>No users match the given search term.</p>
        {/each}
      {/if}
    {:catch error}
      <p class="error">{error?.message || 'Failed to search for users.'}</p>
    {/await}
  </section>
</main>