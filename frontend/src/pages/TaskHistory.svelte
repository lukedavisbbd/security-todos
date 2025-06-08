<script>
    import { onMount } from "svelte";
    import { ArrowLeft, Clock, User, CheckSquare } from "@lucide/svelte";
    import { getTaskHistory, getTaskById } from "../util/tasks";
    import Spinner from "../lib/Spinner.svelte";

    let { route: routeInfo } = $props();
    const taskId = parseInt(routeInfo.result.path.params.taskId);
    
    let task = getTaskById(taskId);
    let history = getTaskHistory(taskId);

    /**
     * Format duration between two timestamps
     * @param {Date} start
     * @param {Date} end
     * @returns {string}
     */
    const formatDuration = (start, end) => {
        const diffMs = end.getTime() - start.getTime();
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
</script>

<style>
    main {
        > header {
            margin-bottom: 1.5rem;

            section {
                margin: 0 0.5rem;
            }
        }
    }

    .timeline {
        padding-left: 0.5rem;

        ul {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            border-left: 1px solid #aaa;
            padding-left: 1.5rem;

            .history-item {
                position: relative;
                background-color: #fafafa;
                padding: 1rem;
                border: 1px solid #0003;
                border-radius: 0.3rem;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                color: #333;
                align-items: start;

                header {
                    display: flex;
                    justify-content: space-between;
                    gap: 1rem;
                    width: 100%;
                }

                &::before {
                    content: '';
                    width: 1rem;
                    height: 1rem;
                    border: 2px solid #aaa;
                    background-color: white;
                    border-radius: 100%;
                    position: absolute;
                    top: calc(50% - 0.5rem);
                    transform: translateX(-3rem);
                }
            }
        }
    }

    .duration-badge {
        background-color: #e3f2fd;
        color: #1976d2;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
    }

    .loading-state {
        text-align: center;
        padding: 3rem 1rem;
        font-size: 2rem;
    }
</style>

<main>
    {#await Promise.all([task, history])}
        <section class="loading-state">
            <Spinner/>
        </section>
    {:then [task, history]}
        <header>
            <button class="btn back-button" onclick={() => window.history.back()}>
                <ArrowLeft/>
                Back to Team
            </button>
            <section>
                <h3>{task.task_name}</h3>
                {#if task.task_content}
                    <p>{task.task_content}</p>
                {/if}
            </section>
        </header>

        <section class="timeline">
            <ul>
                {#each history as entry, index (entry.history_id)}
                    <li class="history-item">
                        <header>
                            <h6>
                                {index === 0 ? 'Task Created' : 'Status/Assignment Changed'}
                            </h6>
                            <p>
                                <Clock/>
                                {formatTimestamp(entry.timestamp)}
                            </p>
                        </header>
                        
                        <section>
                            <section>
                                <CheckSquare/>
                                Status: <strong>{entry.status_name}</strong>
                            </section>
                            <section>
                                <User/>
                                Assigned to: <strong>{entry.assigned_to_name || 'Unassigned'}</strong>
                            </section>
                        </section>

                        {#if index > 0}
                            <section class="duration-badge">
                                Spent {formatDuration(new Date(history[index - 1].timestamp), new Date(entry.timestamp))} in previous state
                            </section>
                        {/if}
                    </li>
                {/each}
            </ul>
        </section>
    {:catch error}
        <section class="error-state">
            <p>{error.message}</p>
        </section>
    {/await}
</main>