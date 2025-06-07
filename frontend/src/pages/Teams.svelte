<script>
    import { Plus } from "@lucide/svelte";
    import { onMount } from "svelte";
    import { getTeamsOverview } from "../util/team";
    import Spinner from "../lib/Spinner.svelte";
    import TeamCard from "../lib/TeamCard.svelte";
    import CreateTeamModal from "../lib/modals/CreateTeamModal.svelte";
    import { requireAuth } from "../util/auth-guard";

    // Authentication guard  
    const authGuard = requireAuth();
    const authState = $derived($authGuard);

    let teams = $state([]);
    let loading = $state(true);
    let error = $state('');
    let showCreateTeam = $state(false);

    const loadTeams = async () => {
        loading = true;
        error = '';
        
        const result = await getTeamsOverview();
        
        if (!result) {
            error = 'Failed to load teams.';
            teams = [];
        } else if ('ok' in result) {
            teams = result.ok;
        } else {
            error = result.err.message || 'Failed to load teams.';
            teams = [];
        }
        
        loading = false;
    };

    /**
     * @param {import('common').Team} newTeam
     */
    const handleTeamCreated = (newTeam) => {
        // Reload teams to get updated stats
        loadTeams();
    };

    onMount(() => {
        // Only load teams if user is authorized
        if (authState.isAuthorized) {
            loadTeams();
        }
    });
    
</script>

<style>
    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .page-title {
        font-size: 2rem;
        margin: 0;
    }

    .teams-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: #666;
    }

    .empty-state h3 {
        margin-bottom: 0.5rem;
        color: #333;
    }

    .error-state {
        text-align: center;
        padding: 2rem 1rem;
        color: #b00;
        background-color: #fdd;
        border-radius: 0.5rem;
        margin-bottom: 2rem;
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
            <header class="page-header">
                <h1 class="page-title">My Teams</h1>
                <button class="btn btn-primary" onclick={() => showCreateTeam = true}>
                    <Plus/>
                    Create Team
                </button>
            </header>

            {#if loading}
                <div class="loading-state">
                    <Spinner/>
                </div>
            {:else if error}
                <div class="error-state">
                    <p>{error}</p>
                    <button class="btn btn-outline" onclick={loadTeams}>
                        Try Again
                    </button>
                </div>
            {:else if teams.length === 0}
                <div class="empty-state">
                    <h3>No teams yet</h3>
                    <p>Create your first team to get started with collaborative task management.</p>
                </div>
            {:else}
                <section class="teams-grid">
                    {#each teams as team (team.team_id)}
                        <TeamCard {team}/>
                    {/each}
                </section>
            {/if}
        {/if}
    </article>
</main>

{#if showCreateTeam && authState.isAuthorized}
    <CreateTeamModal 
        close={() => showCreateTeam = false}
        onTeamCreated={handleTeamCreated}
    />
{/if}