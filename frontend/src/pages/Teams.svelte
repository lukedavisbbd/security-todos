<script>
    import { Plus, ChevronLeft, ChevronRight } from "@lucide/svelte";
    import { onMount } from "svelte";
    import { getTeamsOverview } from "../util/team";
    import Spinner from "../lib/Spinner.svelte";
    import TeamCard from "../lib/TeamCard.svelte";
    import CreateTeamModal from "../lib/modals/CreateTeamModal.svelte";
    import { requireAuth } from "../util/auth-guard";

    const authGuard = requireAuth();
    const authState = $derived($authGuard);

    let teams = $state([]);
    let loading = $state(true);
    let error = $state('');
    let showCreateTeam = $state(false);

    let pagination = $state({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 6
    });

    const loadTeams = async () => {
        loading = true;
        error = '';
        
        const result = await getTeamsOverview({
            page: pagination.currentPage,
            limit: pagination.itemsPerPage
        });
        
        if (!result) {
            error = 'Failed to load teams.';
            teams = [];
            pagination = {
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                itemsPerPage: 6
            };
        } else if ('ok' in result) {
            teams = result.ok.teams;
            pagination = result.ok.pagination;
        } else {
            error = result.err.message || 'Failed to load teams.';
            teams = [];
            pagination = {
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                itemsPerPage: 6
            };
        }
        
        loading = false;
    };

    /**
     * @param {import('common').Team} newTeam
     */
    const handleTeamCreated = (newTeam) => {
        loadTeams();
    };

    /**
     * Handle page change
     * @param {number} page
     */
    const handlePageChange = (page) => {
        pagination = { ...pagination, currentPage: page };
        loadTeams();
    };

    /**
     * Handle page size change
     * @param {number} limit
     */
    const handleLimitChange = (limit) => {
        pagination = { ...pagination, itemsPerPage: limit, currentPage: 1 };
        loadTeams();
    };

    /**
     * Generate array of page numbers for pagination
     * @returns {number[]}
     */
    const getPageNumbers = () => {
        const { currentPage, totalPages } = pagination;
        const pages = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            let start = Math.max(1, currentPage - 2);
            let end = Math.min(totalPages, start + maxVisible - 1);
            
            if (end - start < maxVisible - 1) {
                start = Math.max(1, end - maxVisible + 1);
            }
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
        }
        
        return pages;
    };

    onMount(() => {
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

    .pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 2rem;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .pagination-info {
        color: #666;
        font-size: 0.875rem;
    }

    .pagination-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .page-button {
        padding: 0.375rem 0.75rem;
        border: 1px solid #0003;
        background: white;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: all 150ms;
        font-size: 0.875rem;
    }

    .page-button:hover:not(:disabled) {
        background-color: #f8f9fa;
        border-color: #0005;
    }

    .page-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .page-button.active {
        background-color: #007acc;
        color: white;
        border-color: #007acc;
    }

    .page-size-selector {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #666;
    }

    .page-size-select {
        padding: 0.25rem 0.5rem;
        border: 1px solid #0003;
        border-radius: 0.25rem;
        font-size: 0.875rem;
    }

    .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: #666;
        grid-column: 1 / -1;
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
        grid-column: 1 / -1;
    }

    @media (max-width: 768px) {
        .pagination {
            flex-direction: column;
            align-items: center;
            gap: 1rem;
        }

        .pagination-controls {
            flex-wrap: wrap;
            justify-content: center;
        }

        .teams-grid {
            grid-template-columns: 1fr;
            min-height: 300px;
        }
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
                <div class="teams-grid">
                    <div class="loading-state">
                        <Spinner/>
                    </div>
                </div>
            {:else if error}
                <div class="error-state">
                    <p>{error}</p>
                    <button class="btn btn-outline" onclick={loadTeams}>
                        Try Again
                    </button>
                </div>
            {:else if teams.length === 0}
                <div class="teams-grid">
                    <div class="empty-state">
                        <h3>No teams yet</h3>
                        <p>Create your first team to get started with collaborative task management.</p>
                    </div>
                </div>
            {:else}
                <section class="teams-grid">
                    {#each teams as team (team.team_id)}
                        <TeamCard {team}/>
                    {/each}
                </section>

                
                <div class="pagination">
                    <div class="pagination-info">
                        Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}–{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} teams
                    </div>
                    
                    <div class="pagination-controls">
                        <button 
                            class="page-button"
                            disabled={pagination.currentPage <= 1}
                            onclick={() => handlePageChange(pagination.currentPage - 1)}
                        >
                            <ChevronLeft/>
                            Previous
                        </button>
                        
                        {#each getPageNumbers() as pageNum}
                            <button 
                                class="page-button"
                                class:active={pageNum === pagination.currentPage}
                                onclick={() => handlePageChange(pageNum)}
                            >
                                {pageNum}
                            </button>
                        {/each}
                        
                        <button 
                            class="page-button"
                            disabled={pagination.currentPage >= pagination.totalPages}
                            onclick={() => handlePageChange(pagination.currentPage + 1)}
                        >
                            Next
                            <ChevronRight/>
                        </button>
                    </div>
                    
                    <div class="page-size-selector">
                        <span>Per page:</span>
                        <select 
                            class="page-size-select"
                            value={pagination.itemsPerPage}
                            onchange={(e) => handleLimitChange(Number(e.target.value))}
                        >
                            <option value={6}>6</option>
                            <option value={12}>12</option>
                        </select>
                    </div>
                </div>
                
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