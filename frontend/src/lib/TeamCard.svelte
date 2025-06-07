<script>
    import { Crown, Users, CheckSquare, ArrowRight } from "@lucide/svelte";
    import { route } from "@mateothegreat/svelte5-router";

    /** @type {{ team: import('common').TeamWithStats }} */
    let { team } = $props();
</script>

<style>
    .team-card {
        border: 1px solid #0003;
        border-radius: 0.5rem;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        background-color: #fafafa;
        transition-duration: 150ms;
        
        &:hover {
            box-shadow: 0 0.25rem 0.5rem #0001;
            border-color: #0005;
        }
    }

    .team-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
    }

    .team-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 1.25rem;
        font-weight: 500;
    }

    .team-stats {
        display: flex;
        gap: 1.5rem;
        color: #666;
        font-size: 0.875rem;
    }

    .stat {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .team-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 0.5rem;
    }
</style>

<article class="team-card">
    <header class="team-header">
        <div class="team-title">
            {team.team_name}
            {#if team.is_owner}
                <Crown class="owner-badge"/>
            {/if}
        </div>
    </header>
    
    <section class="team-stats">
        <div class="stat">
            <Users/>
            <span>{team.member_count} member{team.member_count !== 1 ? 's' : ''}</span>
        </div>
        <div class="stat">
            <CheckSquare/>
            <span>{team.task_count} task{team.task_count !== 1 ? 's' : ''}</span>
        </div>
    </section>
    
    <footer class="team-actions">
        <a class="btn btn-outline" href="/teams/{team.team_id}" use:route>
            View Team
            <ArrowRight/>
        </a>
    </footer>
</article>