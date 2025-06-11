import {
    StatusSummarySchema, TeamMemberOverallStatsSchema, TeamMemberTaskSummarySchema,
    TeamOverviewStatsSchema, TeamRecentActivitySchema,
    TeamReportsSchema
} from 'common';
import { pool } from './pool.js';

/**
 * Get team overview statistics
 * @param {number} teamId
 */
export async function getTeamOverviewStats(teamId) {
    const result = await pool.query(
        `SELECT
            team_id, team_name, team_owner_id, owner_name,
            total_members, total_tasks, completed_tasks,
            active_tasks, unassigned_tasks, completion_percentage
        FROM team_overview_stats WHERE team_id = $1`,
        [teamId]
    );

    const row = result.rows[0];

    const teamStats = row ? {
        teamId: row.team_id,
        teamName: row.team_name,
        teamOwnerId: row.team_owner_id,
        ownerName: row.owner_name,
        totalMembers: row.total_members,
        totalTasks: row.total_tasks,
        completedTasks: row.completed_tasks,
        activeTasks: row.active_tasks,
        unassignedTasks: row.unassigned_tasks,
        completionPercentage: row.completion_percentage,
    } : null;

    return TeamOverviewStatsSchema.nullable().parse(teamStats);
}

/**
 * Get task count by status for a team
 * @param {number} teamId
 * @returns {Promise<import('common').StatusSummary[]>}
 */
export async function getTeamTaskStatusSummary(teamId) {
    const result = await pool.query(
        `SELECT status_id, status_name, task_count
        FROM team_task_status_summary
        WHERE team_id = $1
        ORDER BY status_name`,
        [teamId]
    );

    const summaries = result.rows.map(row => {
        return {
            statusId: row.status_id,
            statusName: row.status_name,
            taskCount: row.task_count,
        };
    });

    return StatusSummarySchema.array().parse(summaries);
}

/**
 * Get member task summary with detailed status breakdown
 * @param {number} teamId
 */
export async function getTeamMemberTaskSummary(teamId) {
    const result = await pool.query(
        `SELECT user_id, member_name, status_id, status_name, task_count, avg_days_held
        FROM team_member_task_summary
        WHERE team_id = $1
        ORDER BY member_name, status_name`,
        [teamId]
    );

    const summmaries = result.rows.map(row => {
        return {
            userId: row.user_id,
            memberName: row.member_name,
            statusId: row.status_id,
            statusName: row.status_name,
            taskCount: row.task_count,
            avgDaysHeld: row.avg_days_held,
        };
    });

    return TeamMemberTaskSummarySchema.array().parse(summmaries);
}

/**
 * Get overall member statistics for a team
 * @param {number} teamId
 */
export async function getTeamMemberOverallStats(teamId) {
    const result = await pool.query(
        `SELECT user_id, member_name, total_tasks, completed_tasks, active_tasks, avg_days_per_task
        FROM team_member_overall_stats 
        WHERE team_id = $1
        ORDER BY total_tasks DESC, member_name`,
        [teamId]
    );

    const stats = result.rows.map(row => {
        return {
            userId: row.user_id,
            memberName: row.member_name,
            totalTasks: row.total_tasks,
            completedTasks: row.completed_tasks,
            activeTasks: row.active_tasks,
            avgDaysPerTask: row.avg_days_per_task,
        };
    })

    return TeamMemberOverallStatsSchema.array().parse(stats);
}

/**
 * Get recent task activity for a team (last 30 days)
 * @param {number} teamId
 */
export async function getTeamRecentActivity(teamId) {
    const result = await pool.query(
        `SELECT 
            t.task_id,
            t.task_name,
            s.status_name,
            u.name as member_name,
            h.timestamp,
            (EXTRACT(EPOCH FROM (NOW() - h.timestamp))/86400)::float as days_ago
        FROM history h
        JOIN tasks t ON h.task_id = t.task_id
        JOIN statuses s ON h.status_id = s.status_id
        LEFT JOIN users u ON h.assigned_to_id = u.user_id
        WHERE t.team_id = $1 
            AND h.timestamp >= NOW() - INTERVAL '30 days'
        ORDER BY h.timestamp DESC
        LIMIT 50`,
        [teamId]
    );

    const activity = result.rows.map(row => {
        return {
            taskId: row.task_id,
            taskName: row.task_name,
            statusName: row.status_name,
            memberName: row.member_name,
            timestamp: row.timestamp,
            daysAgo: row.days_ago,
        };
    })

    return TeamRecentActivitySchema.array().parse(activity);
}

/**
 * Get comprehensive team report data
 * @param {number} teamId
 */
export async function getTeamReports(teamId) {
    const [
        overview,
        statusSummary,
        memberSummary,
        memberStats,
        recentActivity
    ] = await Promise.all([
        getTeamOverviewStats(teamId),
        getTeamTaskStatusSummary(teamId),
        getTeamMemberTaskSummary(teamId),
        getTeamMemberOverallStats(teamId),
        getTeamRecentActivity(teamId)
    ]);

    if (!overview)
        return null;

    return TeamReportsSchema.parse({
        overview,
        statusSummary,
        memberSummary,
        memberStats,
        recentActivity
    });
}