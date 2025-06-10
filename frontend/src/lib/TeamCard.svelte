<script>
    import { Crown, Users, CheckSquare, ArrowRight } from "@lucide/svelte";
    import { route } from "@mateothegreat/svelte5-router";
    import { userJwtContents } from "../util/stores";

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

    header {
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
        margin: 0;
    }

    .owner-badge {
        color: #d4a574;
        font-size: 0.75rem;
    }

    .team-stats {
        display: flex;
        gap: 1.5rem;
        color: #666;
        font-size: 0.875rem;
        flex-wrap: wrap;
    }

    .stat {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        margin: 0;
    }

    .stat dt {
        margin: 0;
        display: flex;
        align-items: center;
    }

    .stat dd {
        margin: 0;
        font-weight: 500;
        display: flex;
        align-items: center;
    }

    @media (max-width: 480px) {
        .team-card {
            padding: 1rem;
        }

        header {
            flex-direction: column;
            gap: 0.5rem;
            align-items: flex-start;
        }

        .team-stats {
            gap: 1rem;
            flex-direction: column;
        }

        .team-title {
            font-size: 1.125rem;
        }
    }

    nav {
        display: flex;
        justify-content: flex-end;
        margin-top: 0.5rem;
    }
</style>

<article class="team-card">
    <header>
        <hgroup>
            <h3 class="team-title">
                {team.teamName}
                {#if team.teamOwnerId === $userJwtContents?.user.userId}
                    <Crown class="owner-badge" aria-label="You own this team"/>
                {/if}
            </h3>
            {#if team.teamOwnerId === $userJwtContents?.user.userId}
                <p class="owner-badge">Team Owner</p>
            {/if}
        </hgroup>
    </header>
    
    <section class="team-stats" aria-label="Team statistics">
        <dl class="stat">
            <dt><Users aria-hidden="true"/></dt>
            <dd>
                {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
            </dd>
        </dl>
        <dl class="stat">
            <dt><CheckSquare aria-hidden="true"/></dt>
            <dd>
                {team.taskCount} task{team.taskCount !== 1 ? 's' : ''}
            </dd>
        </dl>
    </section>
    
    <footer>
        <nav aria-label="Team actions">
            <a 
                class="btn btn-outline" 
                href="/team/{team.teamId}" 
                use:route
                aria-label="View {team.teamName} team details"
            >
                View Team
                <ArrowRight aria-hidden="true"/>
            </a>
        </nav>
    </footer>
</article>