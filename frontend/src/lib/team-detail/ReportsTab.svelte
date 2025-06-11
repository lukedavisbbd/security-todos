<script>
    import { ChartColumn, Users, CheckSquare, Clock, TrendingUp } from "@lucide/svelte";
    import Spinner from "../Spinner.svelte";
    import ErrorTryAgain from "../ErrorTryAgain.svelte";
    import { getTeamReports } from "../../util/team";

    /** @type {{
     *   teamId: number,
     * }} */
    let { teamId } = $props();

    let reports = $derived(getTeamReports(teamId));

    /**
     * Format duration in days to human readable format
     * @param {number} days
     * @returns {string}
     */
    const formatDuration = (days) => {
        if (days < 1) {
            const hours = Math.round(days * 24);
            return `${hours}h`;
        } else if (days < 7) {
            return `${Math.round(days)}d`;
        } else if (days < 30) {
            const weeks = Math.round(days / 7);
            return `${weeks}w`;
        } else {
            const months = Math.round(days / 30);
            return `${months}mo`;
        }
    };
    /**
     * Format timestamp to relative time
     * @param {Date} timestamp
     */
    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const diffMs = now.getTime() - timestamp.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        if (diffDays > 0) {
            return `${diffDays}d ago`;
        } else if (diffHours > 0) {
            return `${diffHours}h ago`;
        } else if (diffMinutes > 0) {
            return `${diffMinutes}m ago`;
        } else {
            return 'Just now';
        }
    };
    /**
     * Get member task breakdown grouped by member
     * @param {import('common').TeamMemberTaskSummary[]} memberSummary
     * @returns {{
     *     userId: number,
     *     memberName: string,
     *     statuses: {
     *         statusName: string,
     *         taskCount: number,
     *         avgDaysHeld: number,
     *     }[],
     * }[]}
     */
    const getMemberBreakdown = (memberSummary) => {
        const memberMap = new Map();
        
        memberSummary.forEach(item => {
            if (!memberMap.has(item.userId)) {
                memberMap.set(item.userId, {
                    userId: item.userId,
                    memberName: item.memberName,
                    statuses: [],
                });
            }
            
            if (item.taskCount > 0) {
                memberMap.get(item.userId).statuses.push({
                    statusName: item.statusName,
                    taskCount: item.taskCount,
                    avgDaysHeld: item.avgDaysHeld,
                });
            }
        });
        
        return Array.from(memberMap.values());
    };
</script>

<style>
    .reports-grid {
        display: grid;
        gap: 2rem;
        margin-bottom: 2rem;
    }
    .overview-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }
    .stat-card {
        background-color: #fafafa;
        border: 1px solid #0003;
        border-radius: 0.75rem;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    .stat-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: #666;
        font-size: 0.875rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: #333;
        line-height: 1;
    }
    .stat-subtitle {
        color: #666;
        font-size: 0.875rem;
    }
    .section {
        background-color: #fafafa;
        border: 1px solid #0003;
        border-radius: 0.75rem;
        padding: 1.5rem;
    }
    .section-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #333;
        margin: 0 0 1.5rem 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .status-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
        gap: 1rem;
    }
    .status-item {
        text-align: center;
        padding: 1rem;
        background-color: white;
        border: 1px solid #0001;
        border-radius: 0.5rem;
    }
    .status-count {
        font-size: 1.5rem;
        font-weight: 600;
        color: #333;
    }
    .status-name {
        font-size: 0.75rem;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-top: 0.25rem;
    }
    .member-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
    }
    .member-table th {
        background-color: #f0f0f0;
        padding: 0.75rem;
        text-align: left;
        font-weight: 500;
        border-bottom: 1px solid #0003;
        font-size: 0.875rem;
    }
    .member-table td {
        padding: 0.75rem;
        border-bottom: 1px solid #0001;
        vertical-align: top;
    }
    .member-table tr:hover {
        background-color: #f8f8f8;
    }
    .member-name {
        font-weight: 500;
        color: #333;
    }
    .status-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }
    .status-badge {
        background-color: #e2e8f0;
        color: #4a5568;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 500;
    }
    .activity-list {
        max-height: 20rem;
        overflow-y: auto;
        margin-top: 1rem;
    }
    .activity-item {
        padding: 0.75rem;
        border-bottom: 1px solid #0001;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }
    .activity-item:last-child {
        border-bottom: none;
    }
    .activity-details {
        flex: 1;
        min-width: 0;
    }
    .activity-task {
        font-weight: 500;
        color: #333;
    }
    .activity-meta {
        color: #666;
        font-size: 0.875rem;
    }
    .activity-time {
        color: #999;
        font-size: 0.75rem;
        white-space: nowrap;
    }
    .loading-state {
        text-align: center;
        padding: 3rem 1rem;
        color: #666;
    }
    .empty-state {
        text-align: center;
        padding: 2rem;
        color: #666;
    }
    .completion-bar {
        width: 100%;
        height: 0.5rem;
        background-color: #e2e8f0;
        border-radius: 0.25rem;
        overflow: hidden;
        margin-top: 0.5rem;
    }
    .completion-fill {
        height: 100%;
        background-color: #48bb78;
        transition: width 0.3s ease;
    }
    @media (max-width: 768px) {
        .overview-cards {
            grid-template-columns: 1fr;
        }
        .status-grid {
            grid-template-columns: repeat(2, 1fr);
        }
        .member-table {
            font-size: 0.875rem;
        }
        .member-table th,
        .member-table td {
            padding: 0.5rem;
        }
        .activity-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }
    }
</style>

{#await reports}
    <section class="loading-state">
        <Spinner/>
        <p>Loading team reports...</p>
    </section>
{:then reports}
    {#if reports}
        <section class="overview-cards">
            <article class="stat-card">
                <header class="stat-header">
                    <Users/>
                    Team Members
                </header>
                <section class="stat-value">{reports.overview?.totalMembers || 0}</section>
                <section class="stat-subtitle">Active team members</section>
            </article>

            <article class="stat-card">
                <header class="stat-header">
                    <CheckSquare/>
                    Total Tasks
                </header>
                <section class="stat-value">{reports.overview?.totalTasks || 0}</section>
                <section class="stat-subtitle">
                    {reports.overview?.activeTasks || 0} active, 
                    {reports.overview?.unassignedTasks || 0} unassigned
                </section>
            </article>

            <article class="stat-card">
                <header class="stat-header">
                    <TrendingUp/>
                    Completion Rate
                </header>
                <section class="stat-value">{reports.overview.completionPercentage.toFixed(1) || 0}%</section>
                <section class="stat-subtitle">
                    {reports.overview?.completedTasks || 0} of {reports.overview.totalTasks || 0} completed
                </section>
                <section class="completion-bar">
                    <div 
                        class="completion-fill" 
                        style="width: {reports.overview.completionPercentage || 0}%"
                    ></div>
                </section>
            </article>
        </section>

        <section class="reports-grid">
            <section class="section">
                <h3 class="section-title">
                    <ChartColumn/>
                    Task Status Distribution
                </h3>
                {#if reports.statusSummary.length > 0}
                    <article class="status-grid">
                        {#each reports.statusSummary as status}
                            <section class="status-item">
                                <section class="status-count">{status.taskCount}</section>
                                <section class="status-name">{status.statusName}</section>
                            </section>
                        {/each}
                    </article>
                {:else}
                    <div class="empty-state">
                        <p>No tasks found.</p>
                    </div>
                {/if}
            </section>

            <section class="section">
                <h3 class="section-title">
                    <Users/>
                    Member Performance
                </h3>
                {#if reports.memberStats?.length > 0}
                    <table class="member-table">
                        <thead>
                            <tr>
                                <th>Member</th>
                                <th>Total Tasks</th>
                                <th>Completed</th>
                                <th>Active</th>
                                <th>Avg. Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each reports.memberStats as member}
                                <tr>
                                    <td>
                                        <div class="member-name">{member.memberName}</div>
                                    </td>
                                    <td>{member.totalTasks}</td>
                                    <td>{member.completedTasks}</td>
                                    <td>{member.activeTasks}</td>
                                    <td>{formatDuration(member.avgDaysPerTask)}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                {:else}
                    <section class="empty-state">
                        <p>No member data available.</p>
                    </section>
                {/if}
            </section>

            <section class="section">
                <h3 class="section-title">
                    <CheckSquare/>
                    Task Breakdown by Member
                </h3>
                {#if reports.memberSummary.length > 0}
                    <table class="member-table">
                        <thead>
                            <tr>
                                <th>Member</th>
                                <th>Current Tasks by Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each getMemberBreakdown(reports.memberSummary) as member}
                                <tr>
                                    <td>
                                        <div class="member-name">{member.memberName}</div>
                                    </td>
                                    <td>
                                        {#if member.statuses.length > 0}
                                            <div class="status-badges">
                                                {#each member.statuses as status}
                                                    <span class="status-badge">
                                                        {status.statusName.toUpperCase()}: {status.taskCount}
                                                        {#if status.avgDaysHeld > 0}
                                                            ({formatDuration(status.avgDaysHeld)})
                                                        {/if}
                                                    </span>
                                                {/each}
                                            </div>
                                        {:else}
                                            <span style="color: #999; font-style: italic;">No active tasks</span>
                                        {/if}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                {:else}
                    <section class="empty-state">
                        <p>No task breakdown data available.</p>
                    </section>
                {/if}
            </section>

            <section class="section">
                <h3 class="section-title">
                    <Clock/>
                    Recent Activity (Last 30 Days)
                </h3>
                {#if reports.recentActivity?.length > 0}
                    <section class="activity-list">
                        {#each reports.recentActivity as activity}
                            <div class="activity-item">
                                <div class="activity-details">
                                    <div class="activity-task">{activity.taskName}</div>
                                    <div class="activity-meta">
                                        {activity.statusName}
                                        {#if activity.memberName}
                                            • {activity.memberName}
                                        {:else}
                                            • Unassigned
                                        {/if}
                                    </div>
                                </div>
                                <div class="activity-time">
                                    {formatTimeAgo(activity.timestamp)}
                                </div>
                            </div>
                        {/each}
                    </section>
                {:else}
                    <section class="empty-state">
                        <p>No recent activity found.</p>
                    </section>
                {/if}
            </section>
        </section>
    {:else}
        <section class="error-wrapper">
            <p>Team does not exist.</p>
        </section>
    {/if}
{:catch error}
    <ErrorTryAgain {error} onTryAgain={() => reports = getTeamReports(teamId)}/>
{/await}
