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
    padding: 0 1rem;
    max-width: 32rem;
    margin: 3rem auto 5rem auto;

    h1 {
      margin-bottom: 1rem;
      color: #333;
    }

    p {
      color: #666;
    }
  }

  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
    gap: 2rem;
    margin: 3rem 0;
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

  .cta {
    text-align: center;
    margin-top: 3rem;
  }


    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .teams-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .no-teams {
      text-align: center;
      padding: 3rem 1rem;
      color: #666;

      h3 {
        margin-bottom: 0.5rem;
        color: #333;
      }
    }

    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      margin: 4rem 0;

      p {
        color: #c00;
      }
    }

    .loading-state {
        text-align: center;
        padding: 3rem 1rem;
        font-size: 2rem;
    }
</style>

<main>
  {#if $userJwtContents}
    <header>
      <h3>My Teams</h3>
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
        <section class="teams-grid">
          {#each teams as team (team.team_id)}
            <TeamCard {team}/>
          {/each}
        </section>
      {:else}
        <section class="no-teams">
          <h3>No teams yet</h3>
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

    <section class="features">
      <div class="feature">
        <div class="feature-icon">
          <Users class="full"/>
        </div>
        <h3>Team Collaboration</h3>
        <p>Create teams and invite members to work together on shared goals.</p>
      </div>
      <div class="feature">
        <div class="feature-icon">
          <CheckSquare class="full"/>
        </div>
        <h3>Task Management</h3>
        <p>Create, assign, and track tasks with statuses.</p>
      </div>
    </section>

    <section class="cta">
      <p>Get started by creating an account.</p>
    </section>
  {/if}
</main>
