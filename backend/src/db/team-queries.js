import { pool } from './pool.js';

/**
 * Create a new team with a given owner (team lead).
 * @param {number} ownerId
 * @param {string} teamName
 * @returns {Promise<Object>}
 */
export async function createTeam(ownerId, teamName) {
    const result = await pool.query(
        `INSERT INTO teams (team_name, owner_id)
         VALUES ($1, $2)
         RETURNING *`,
        [teamName, ownerId]
    );
    return result.rows[0];
}

/**
 * Get all teams led by a specific user.
 * @param {number} ownerId
 * @returns {Promise<Array<any>>}
 */
export async function getTeamsLedByUser(ownerId) {
    const result = await pool.query(
        `SELECT *
         FROM teams
         WHERE owner_id = $1`,
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
         VALUES ($1, $2)`,
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
    await pool.query(
        `DELETE FROM user_teams
         WHERE user_id = $1
           AND team_id = $2`,
        [userId, teamId]
    );
}

/**
 * Get all teams to which a user belongs.
 * @param {number} userId
 * @returns {Promise<Array<any>>}
 */
export async function getTeamsForUser(userId) {
    const result = await pool.query(
        `SELECT t.*
         FROM teams t
         JOIN user_teams ut ON t.team_id = ut.team_id
         WHERE ut.user_id = $1`,
        [userId]
    );
    return result.rows;
}

/**
 * Get all users who are members of a specific team.
 * @param {number} teamId
 * @returns {Promise<Array<Object>>}
 */
export async function getUsersInTeam(teamId) {
    const result = await pool.query(
        `SELECT u.user_id, u.email
         FROM users u
         JOIN user_teams ut ON u.user_id = ut.user_id
         WHERE ut.team_id = $1`,
        [teamId]
    );
    return result.rows;
}
