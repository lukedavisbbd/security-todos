<script>
  import { ArrowRight, Users, CheckSquare } from "@lucide/svelte";
  import { userJwtContents } from "../util/stores";
  import { route } from "@mateothegreat/svelte5-router";
</script>

<style>
  .hero {
    text-align: center;
    padding: 3rem 1rem;
    max-width: 32rem;
    margin: 0 auto;
  }

  .hero h1 {
    margin-bottom: 1rem;
    color: #333;
  }

  .hero p {
    margin-bottom: 2rem;
    color: #666;
    line-height: 1.6;
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
</style>

<main>
  <article>
    {#if $userJwtContents}
      <section class="hero">
        <h1>Welcome back, {$userJwtContents.user.name}!</h1>
        <p>
          Ready to tackle your tasks? Head over to your teams to see what needs to be done.
        </p>
        <a class="btn btn-primary" href="/teams" use:route>
          <Users/>
          View My Teams
          <ArrowRight/>
        </a>
      </section>
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
  </article>
</main>