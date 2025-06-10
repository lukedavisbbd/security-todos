<script>
  import { Users, CheckSquare, Plus, RotateCcw } from "@lucide/svelte";
  import { userJwtContents } from "../util/stores";
  import TeamCard from "../lib/TeamCard.svelte";
  import Spinner from "../lib/Spinner.svelte";
  import CreateTeamModal from "../lib/modals/CreateTeamModal.svelte";
  import { getTeamsOverview } from "../util/team";

  let teams = $derived($userJwtContents ? getTeamsOverview() : Promise.resolve([]));
  let showCreateTeam = $state(false);
</script>

<style>
  .hero {
    text-align: center;
    padding: clamp(1rem, 4vw, 2rem) clamp(0.5rem, 3vw, 1rem);
    max-width: 32rem;
    margin: clamp(2rem, 5vw, 3rem) auto clamp(3rem, 6vw, 5rem) auto;
  }

  .hero h1 {
    margin-bottom: 1rem;
    color: #333;
    font-size: clamp(1.5rem, 6vw, 3rem);
  }

  .hero p {
    color: #666;
    font-size: clamp(0.875rem, 3vw, 1rem);
    line-height: 1.6;
  }

  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
    gap: 2rem;
    margin: 3rem 0;
    list-style: none;
    padding: 0;
  }

  .feature {
    text-align: center;
    padding: 2rem 1rem;
    border: 1px solid #0001;
    border-radius: 0.5rem;
    background-color: #fafafa;
  }

  .feature-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: #666;
  }

  .feature h3 {
    margin-bottom: 0.5rem;
    color: #333;
  }

  .feature p {
    color: #666;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  header {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 2rem;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .header-teams {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  header h1 {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    color: #1a202c;
    font-weight: 600;
    margin: 0;
  }

  .teams-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
    list-style: none;
    padding: 0;
  }

  .no-teams {
    text-align: center;
    padding: 3rem 1rem;
    color: #666;
  }

  .no-teams h2 {
    margin-bottom: clamp(0.5rem, 2vw, 1rem);
    color: #333;
    font-size: clamp(1.25rem, 3vw, 1.5rem);
  }

  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin: 4rem 0;
  }

  .error-state p {
    color: #c00;
  }

  .loading-state {
    text-align: center;
    padding: 3rem 1rem;
    font-size: 2rem;
  }

  @media (max-width: 640px) {
    header {
      flex-direction: column;
      gap: 1rem;
    }

    .teams-grid {
      grid-template-columns: 1fr;
    }

    .features {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }
</style>

<main>
  {#if $userJwtContents}
    <header class="header-teams">
      <h1>My Teams</h1>
      <button class="btn btn-primary" onclick={() => showCreateTeam = true}>
        <Plus/>
        Create Team
      </button>
    </header>

    {#await teams}
      <section class="loading-state">
        <Spinner/>
      </section>
    {:then teams}
      {#if teams.length}
        <ul class="teams-grid">
          {#each teams as team (team.teamId)}
            <li>
              <TeamCard {team}/>
            </li>
          {/each}
        </ul>
      {:else}
        <section class="no-teams">
          <h2>No teams yet</h2>
          <p>Create your first team to get started with collaborative task management.</p>
        </section>
      {/if}
    {:catch}
      <section class="error-state">
        <p>Failed to load teams.</p>
        <button class="btn btn-outline" onclick={() => teams = getTeamsOverview()}>
          <RotateCcw/> Try Again
        </button>
      </section>
    {/await}
    
    {#if showCreateTeam}
      <CreateTeamModal
        close={() => showCreateTeam = false}
        onTeamCreated={() => teams = getTeamsOverview()}
      />
    {/if}
  {:else}
    <section class="hero">
      <h1>Welcome to To-Do</h1>
      <p>
        Organize your team's work with collaborative task management. 
        Create teams, assign tasks, and track progress together.
      </p>
    </section>

    <ul class="features">
      <li>
        <article class="feature">
          <header class="feature-icon">
            <Users class="full"/>
          </header>
          <h3>Team Collaboration</h3>
          <p>Create teams and add members to work together.</p>
        </article>
      </li>
      <li>
        <article class="feature">
          <header class="feature-icon">
            <CheckSquare class="full"/>
          </header>
          <h3>Task Management</h3>
          <p>Create, assign, and track tasks with statuses.</p>
        </article>
      </li>
    </ul>
  {/if}
</main>