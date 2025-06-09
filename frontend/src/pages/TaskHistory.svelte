<script>
    import { ArrowLeft, Clock, User, CheckSquare } from "@lucide/svelte";
    import { getTaskHistory, getTaskById } from "../util/tasks";
    import Spinner from "../lib/Spinner.svelte";
    import { getTeamMembers } from "../util/team";
    import { getAllStatuses } from "../util/status";
    import ErrorTryAgain from "../lib/ErrorTryAgain.svelte";
    import { route as softRoute } from "@mateothegreat/svelte5-router";

    let { route } = $props();
    const taskId = parseInt(route.result.path.params.taskId);
    
    let taskMembers = $state(getTaskById(taskId).then(async (task) => {
        return {
            task,
            members: task ? await getTeamMembers(task.teamId) : [],
        }
    }));
    let history = $state(getTaskHistory(taskId));
    let allStatuses = $state(getAllStatuses());

    /**
     * Format duration between two timestamps
     * @param {Date} start
     * @param {Date} end
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

    .status-badge {
        display: inline-block;
        text-transform: uppercase;
        font-weight: 500;
        letter-spacing: 0.05em;
        font-size: 0.75rem;
        background-color: #f0f4f8;
        border: 1px solid #007acc;
        border-radius: 0.3rem;
        padding: 0.1rem 0.35rem;
        color: #007acc;
    }

    .assigned-to {
        color: black;
    }

    .back-button {
        display: inline-flex;
    }
</style>

<main>
    {#await Promise.all([taskMembers, history, allStatuses])}
        <section class="loading-state">
            <Spinner/>
        </section>
    {:then [{task, members}, history, allStatuses]}
        {#if task}
            <header>
                <a class="btn back-button" use:softRoute href="/team/{task.teamId}">
                    <ArrowLeft/>
                    Back to Team
                </a>
                <section>
                    <h3>{task.taskName}</h3>
                    {#if task.taskContent}
                        <p>{task.taskContent}</p>
                    {/if}
                </section>
            </header>

            <section class="timeline">
                <ul>
                    {#each history as entry, index (entry.historyId)}
                        {@const time = entry.timestamp}
                        <li class="history-item">
                            <header>
                                <h6>
                                    {index === 0 ? 'Task Created' : 'Status/Assignment Changed'}
                                </h6>
                                <p>
                                    <Clock/>
                                    {time.toLocaleString()}
                                </p>
                            </header>
                            
                            <section>
                                <section>
                                    <CheckSquare/>
                                    Status: <span class="status-badge">{allStatuses.find(s => s.statusId === entry.statusId)?.statusName}</span>
                                </section>
                                <section>
                                    <User/>
                                    Assigned to: <span class="assigned-to">{members.find(m => m.userId === entry.assignedToId)?.name ?? 'Nobody'}</span>
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
        {:else}
            <div class="error-wrapper">
                <p>Team does not exist.</p>
            </div>
        {/if}
    {:catch error}
        <ErrorTryAgain {error} onTryAgain={() => {
            taskMembers = getTaskById(taskId).then(async (task) => {
                return {
                    task,
                    members: task ? await getTeamMembers(task.teamId) : [],
                }
            });
            history = getTaskHistory(taskId);
            allStatuses = getAllStatuses();
        }}/>
    {/await}
</main>