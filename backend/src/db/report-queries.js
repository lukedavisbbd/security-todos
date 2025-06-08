import { pool } from './pool.js';

/**
 * Get team overview statistics
 * @param {number} teamId
 * @returns {Promise<Object>}
 */
export async function getTeamOverviewStats(teamId) {
    const result = await pool.query(
        `SELECT * FROM team_overview_stats WHERE team_id = $1`,
        [teamId]
    );
    return result.rows[0] || null;
}

/**
 * Get task count by status for a team
 * @param {number} teamId
 * @returns {Promise<Array<{status_id: number, status_name: string, task_count: number}>>}
 */
export async function getTeamTaskStatusSummary(teamId) {
    const result = await pool.query(
        `SELECT status_id, status_name, task_count 
         FROM team_task_status_summary 
         WHERE team_id = $1
         ORDER BY status_name`,
        [teamId]
    );
    return result.rows;
}

/**
 * Get member task summary with detailed status breakdown
 * @param {number} teamId
 * @returns {Promise<Array<{user_id: number, member_name: string, member_email: string, status_id: number, status_name: string, task_count: number, avg_days_held: number}>>}
 */
export async function getTeamMemberTaskSummary(teamId) {
    const result = await pool.query(
        `SELECT user_id, member_name, member_email, status_id, status_name, task_count, avg_days_held
         FROM team_member_task_summary 
         WHERE team_id = $1
         ORDER BY member_name, status_name`,
        [teamId]
    );
    return result.rows;
}

/**
 * Get overall member statistics for a team
 * @param {number} teamId
 * @returns {Promise<Array<{user_id: number, member_name: string, member_email: string, total_tasks: number, completed_tasks: number, active_tasks: number, avg_days_per_task: number}>>}
 */
export async function getTeamMemberOverallStats(teamId) {
    const result = await pool.query(
        `SELECT user_id, member_name, member_email, total_tasks, completed_tasks, active_tasks, avg_days_per_task
         FROM team_member_overall_stats 
         WHERE team_id = $1
         ORDER BY total_tasks DESC, member_name`,
        [teamId]
    );
    return result.rows;
}

/**
 * Get recent task activity for a team (last 30 days)
 * @param {number} teamId
 * @returns {Promise<Array<{task_id: number, task_name: string, status_name: string, member_name: string, timestamp: Date, days_ago: number}>>}
 */
export async function getTeamRecentActivity(teamId) {
    const result = await pool.query(
        `SELECT 
            t.task_id,
            t.task_name,
            s.status_name,
            u.name as member_name,
            h.timestamp,
            EXTRACT(EPOCH FROM (NOW() - h.timestamp))/86400 as days_ago
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
    return result.rows;
}

/**
 * Get comprehensive team report data
 * @param {number} teamId
 * @returns {Promise<{overview: Object, statusSummary: Array, memberSummary: Array, memberStats: Array, recentActivity: Array}>}
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

    return {
        overview,
        statusSummary,
        memberSummary,
        memberStats,
        recentActivity
    };
}