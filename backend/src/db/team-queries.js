import { pool } from './pool.js';

/**
 * Create a new team with a given owner (team lead).
 * @param {number} ownerId
 * @param {string} teamName
 * @returns {Promise<import('common').Team>}
 */
export async function createTeam(ownerId, teamName) {
    const result = await pool.query(
        `INSERT INTO teams (team_name, team_owner_id)
        VALUES ($1, $2)
        RETURNING team_id, team_name, team_owner_id`,
        [teamName, ownerId]
    );
    return result.rows[0];
}

/**
 * Get all teams for a user with stats (member count, task count, whether user is owner).
 * @param {number} userId
 * @returns {Promise<import('common').TeamWithStats[]>}
 */
export async function getTeamsWithStats(userId) {
    const result = await pool.query(
        `SELECT 
            t.team_id,
            t.team_name,
            t.team_owner_id,
            (t.team_owner_id = $1) as is_owner,
            COALESCE(member_count.count, 0) as member_count,
            COALESCE(task_count.count, 0) as task_count
         FROM teams t
         LEFT JOIN (
             SELECT team_id, COUNT(*) as count
             FROM user_teams
             GROUP BY team_id
         ) member_count ON t.team_id = member_count.team_id
         LEFT JOIN (
             SELECT team_id, COUNT(*) as count
             FROM tasks
             GROUP BY team_id
         ) task_count ON t.team_id = task_count.team_id
         WHERE t.team_owner_id = $1 
            OR t.team_id IN (
                SELECT team_id FROM user_teams WHERE user_id = $1
            )
         ORDER BY t.team_name`,
        [userId]
    );
    return result.rows;
}

/**
 * Get all teams led by a specific user.
 * @param {number} ownerId
 * @returns {Promise<import('common').Team[]>}
 */
export async function getTeamsLedByUser(ownerId) {
    const result = await pool.query(
        `SELECT team_id, team_name, team_owner_id
         FROM teams
         WHERE team_owner_id = $1
         ORDER BY team_name`,
        [ownerId]
    );
    return result.rows;
}

/**
 * Add a user to a team.
 * @param {number} userId
 * @param {number} teamId
 * @returns {Promise<void>}
 */
export async function addUserToTeam(userId, teamId) {
    await pool.query(
        `INSERT INTO user_teams (user_id, team_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, team_id) DO NOTHING`,
        [userId, teamId]
    );
}

/**
 * Remove a user from a team.
 * @param {number} userId
 * @param {number} teamId
 * @returns {Promise<void>}
 */
export async function removeUserFromTeam(userId, teamId) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        await client.query(
            `UPDATE tasks 
             SET assigned_to_id = NULL 
             WHERE assigned_to_id = $1 
               AND team_id = $2`,
            [userId, teamId]
        );
        
        await client.query(
            `DELETE FROM user_teams
             WHERE user_id = $1
               AND team_id = $2`,
            [userId, teamId]
        );
        
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Get all teams to which a user belongs.
 * @param {number} userId
 * @returns {Promise<import('common').Team[]>}
 */
export async function getTeamsForUser(userId) {
    const result = await pool.query(
        `SELECT t.team_id, t.team_name, t.team_owner_id
         FROM teams t
         JOIN user_teams ut ON t.team_id = ut.team_id
         WHERE ut.user_id = $1
         ORDER BY t.team_name`,
        [userId]
    );
    return result.rows;
}

/**
 * Get all users who are members of a specific team.
 * @param {number} teamId
 * @returns {Promise<import('common').TeamMember[]>}
 */
export async function getUsersInTeam(teamId) {
    const result = await pool.query(
        `SELECT u.user_id, u.email, u.name
         FROM users u
         JOIN user_teams ut ON u.user_id = ut.user_id
         WHERE ut.team_id = $1
         ORDER BY u.name`,
        [teamId]
    );
    return result.rows;
}

/**
 * Get team by ID.
 * @param {number} teamId
 * @returns {Promise<import('common').Team | null>}
 */
export async function getTeamById(teamId) {
    const result = await pool.query(
        `SELECT team_id, team_name, team_owner_id
         FROM teams
         WHERE team_id = $1`,
        [teamId]
    );
    return result.rows[0] || null;
}

/**
 * Check if user is team owner.
 * @param {number} teamId
 * @param {number} userId
 * @returns {Promise<boolean>}
 */
export async function isTeamOwner(teamId, userId) {
    const result = await pool.query(
        `SELECT 1
         FROM teams
         WHERE team_id = $1 AND team_owner_id = $2`,
        [teamId, userId]
    );
    return result.rows.length > 0;
}