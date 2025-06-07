<script>
    import { onMount } from "svelte";
    import { ArrowLeft, Clock, User, CheckSquare } from "@lucide/svelte";
    import { requireAuth } from "../util/auth-guard";
    import { getTaskHistory, getTaskById } from "../util/tasks";
    import { route } from "@mateothegreat/svelte5-router";
    import Spinner from "../lib/Spinner.svelte";

    let { route: routeInfo } = $props();
    const taskId = parseInt(routeInfo.result.path.params.taskId);
    
    const authGuard = requireAuth();
    const authState = $derived($authGuard);
    
    let task = $state(null);
    let history = $state([]);
    let loading = $state(true);
    let error = $state('');

    /**
     * Format duration between two timestamps
     * @param {Date} start
     * @param {Date} end
     * @returns {string}
     */
    const formatDuration = (start, end) => {
        const diffMs = end - start;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
        } else if (diffMinutes > 0) {
            return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
        } else {
            return 'Less than a minute';
        }
    };

    /**
     * Format timestamp for display
     * @param {string} timestamp
     * @returns {string}
     */
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    /**
     * Get assignment display text
     * @param {string | null} name
     * @returns {string}
     */
    const getAssignmentText = (name) => {
        return name || 'Unassigned';
    };

    const loadTaskHistory = async () => {
        loading = true;
        error = '';
        
        try {
            // Load task info
            const taskResult = await getTaskById(taskId);
            if (!taskResult || 'err' in taskResult) {
                error = taskResult?.err?.message || 'Failed to load task';
                return;
            }
            task = taskResult.ok;

            // Load task history
            const historyResult = await getTaskHistory(taskId);
            if (!historyResult || 'err' in historyResult) {
                error = historyResult?.err?.message || 'Failed to load task history';
                return;
            }
            history = historyResult.ok;

        } catch (err) {
            error = 'An unexpected error occurred';
            console.error(err);
        } finally {
            loading = false;
        }
    };

    onMount(() => {
        if (isNaN(taskId)) {
            error = 'Invalid task ID';
            loading = false;
            return;
        }

        if (authState.isAuthorized) {
            loadTaskHistory();
        }
    });

    $effect(() => {
        if (authState.isAuthorized && !task && !loading && !error) {
            loadTaskHistory();
        }
    });
</script>

<style>
    .back-button {
        margin-bottom: 1.5rem;
    }

    .page-header {
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #0003;
    }

    .page-title {
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
        color: #333;
    }

    .task-info {
        color: #666;
        font-size: 0.9rem;
    }

    .timeline {
        position: relative;
        padding-left: 2rem;
    }

    .timeline::before {
        content: '';
        position: absolute;
        left: 1rem;
        top: 0;
        bottom: 0;
        width: 2px;
        background-color: #0003;
    }

    .timeline-item {
        position: relative;
        margin-bottom: 2rem;
        background-color: #fafafa;
        border: 1px solid #0003;
        border-radius: 0.5rem;
        padding: 1.25rem;
        margin-left: 1rem;
    }

    .timeline-item::before {
        content: '';
        position: absolute;
        left: -1.75rem;
        top: 1.25rem;
        width: 12px;
        height: 12px;
        background-color: #007acc;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 2px #007acc;
    }

    .timeline-item:first-child::before {
        background-color: #28a745;
        box-shadow: 0 0 0 2px #28a745;
    }

    .timeline-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.75rem;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .timeline-title {
        font-weight: 500;
        color: #333;
        font-size: 1rem;
    }

    .timeline-timestamp {
        color: #666;
        font-size: 0.875rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .timeline-details {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .detail-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #666;
        font-size: 0.875rem;
    }

    .duration-badge {
        background-color: #e3f2fd;
        color: #1976d2;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 500;
        margin-top: 0.5rem;
        display: inline-block;
    }

    .single-record {
        text-align: center;
        padding: 3rem 1rem;
        background-color: #fafafa;
        border: 1px solid #0003;
        border-radius: 0.5rem;
        color: #666;
    }

    .single-record h3 {
        margin-bottom: 0.5rem;
        color: #333;
    }

    .loading-state {
        text-align: center;
        padding: 3rem 1rem;
        font-size: 2rem;
    }

    .error-state {
        text-align: center;
        padding: 2rem 1rem;
        color: #b00;
        background-color: #fdd;
        border-radius: 0.5rem;
        margin-bottom: 2rem;
    }

    @media (max-width: 768px) {
        .timeline {
            padding-left: 1.5rem;
        }
        
        .timeline::before {
            left: 0.75rem;
        }
        
        .timeline-item {
            margin-left: 0.75rem;
        }
        
        .timeline-item::before {
            left: -1.5rem;
        }
        
        .timeline-header {
            flex-direction: column;
            align-items: stretch;
            gap: 0.5rem;
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
            <button class="btn btn-outline back-button" onclick={() => window.history.back()}>
                <ArrowLeft/>
                Back to Team
            </button>

            {#if loading}
                <div class="loading-state">
                    <Spinner/>
                </div>
            {:else if error}
                <div class="error-state">
                    <p>{error}</p>
                    <button class="btn btn-outline" onclick={loadTaskHistory}>
                        Try Again
                    </button>
                </div>
            {:else if task}
                <header class="page-header">
                    <h1 class="page-title">Task History</h1>
                    <div class="task-info">
                        <strong>{task.task_name}</strong>
                        {#if task.task_content}
                            <br>{task.task_content}
                        {/if}
                    </div>
                </header>

                {#if history.length <= 1}
                    <div class="single-record">
                        <h3>Simple History</h3>
                        {#if history.length === 1}
                            <p>
                                This task has only been in <strong>{history[0].status_name}</strong> status
                                since {formatTimestamp(history[0].timestamp)}.
                            </p>
                            {#if history[0].assigned_to_name}
                                <p>
                                    Assigned to <strong>{history[0].assigned_to_name}</strong>.
                                </p>
                            {:else}
                                <p>Currently <strong>unassigned</strong>.</p>
                            {/if}
                        {:else}
                            <p>No history records found for this task.</p>
                        {/if}
                    </div>
                {:else}
                    <div class="timeline">
                        {#each history as entry, index (entry.history_id)}
                            <div class="timeline-item">
                                <div class="timeline-header">
                                    <div class="timeline-title">
                                        {index === 0 ? 'Task Created' : 'Status/Assignment Changed'}
                                    </div>
                                    <div class="timeline-timestamp">
                                        <Clock/>
                                        {formatTimestamp(entry.timestamp)}
                                    </div>
                                </div>
                                
                                <div class="timeline-details">
                                    <div class="detail-item">
                                        <CheckSquare/>
                                        Status: <strong>{entry.status_name}</strong>
                                    </div>
                                    <div class="detail-item">
                                        <User/>
                                        Assigned to: <strong>{getAssignmentText(entry.assigned_to_name)}</strong>
                                    </div>
                                </div>

                                {#if index > 0}
                                    <div class="duration-badge">
                                        Spent {formatDuration(new Date(history[index - 1].timestamp), new Date(entry.timestamp))} in previous state
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            {/if}
        {/if}
    </article>
</main>