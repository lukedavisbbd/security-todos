import { pool } from './pool.js';

/**
 * Create a new team with a given owner (team lead).
 * @param {number} ownerId
 * @param {string} teamName
 * @returns {Promise<import('common').Team>}
 */
export async function createTeam(ownerId, teamName) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const teamResult = await client.query(
            `INSERT INTO teams (team_name, team_owner_id)
             VALUES ($1, $2)
             RETURNING team_id, team_name, team_owner_id`,
            [teamName, ownerId]
        );
        
        const team = teamResult.rows[0];
        
        await client.query(
            `INSERT INTO user_teams (user_id, team_id)
             VALUES ($1, $2)`,
            [ownerId, team.team_id]
        );
        
        await client.query('COMMIT');
        
        return team;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Get all teams for a user with stats (member count, task count, whether user is owner).
 * @param {number} userId
 * @param {Object} [options] - Pagination options
 * @param {number} [options.page=1] - Page number (1-based)
 * @param {number} [options.limit=10] - Items per page
 * @returns {Promise<{teams: import('common').TeamWithStats[], pagination: {currentPage: number, totalPages: number, totalItems: number, itemsPerPage: number}}>}
 */
export async function getTeamsWithStats(userId, options = {}) {
    const {
        page = 1,
        limit = 10
    } = options;

    const countQuery = `
        SELECT COUNT(*) as total
        FROM teams t
        WHERE t.team_owner_id = $1 
            OR t.team_id IN (
                SELECT team_id FROM user_teams WHERE user_id = $1
            )
    `;
    
    const countResult = await pool.query(countQuery, [userId]);
    const totalItems = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;

    const teamsQuery = `
        SELECT 
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
         ORDER BY t.team_name
         LIMIT $2 OFFSET $3
    `;
    
    const teamsResult = await pool.query(teamsQuery, [userId, limit, offset]);

    return {
        teams: teamsResult.rows,
        pagination: {
            currentPage: page,
            totalPages,
            totalItems,
            itemsPerPage: limit
        }
    };
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

    const countResult = await pool.query(
        `SELECT COUNT(*) as member_count
         FROM user_teams
         WHERE team_id = $1`,
        [teamId]
    );
    
    const currentMemberCount = parseInt(countResult.rows[0].member_count);
    
    if (currentMemberCount >= 10) {
        const error = new Error('Team has reached maximum capacity of 10 members');
        error.code = 'TEAM_CAPACITY_EXCEEDED';
        throw error;
    }
    
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

    const ownerCheck = await pool.query(
        `SELECT team_owner_id
         FROM teams
         WHERE team_id = $1`,
        [teamId]
    );
    
    if (ownerCheck.rows.length === 0) {
        const error = new Error('Team not found');
        error.code = 'TEAM_NOT_FOUND';
        throw error;
    }
    
    if (ownerCheck.rows[0].team_owner_id === userId) {
        const error = new Error('Team owner cannot be removed from the team');
        error.code = 'CANNOT_REMOVE_OWNER';
        throw error;
    }
    
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

/**
 * Delete a team and all associated data (cascades handle tasks, history, user_teams).
 * @param {number} teamId
 * @param {number} ownerId - User requesting deletion (must be team owner)
 * @returns {Promise<void>}
 */
export async function deleteTeam(teamId, ownerId) {
    const ownerCheck = await pool.query(
        `SELECT team_name
         FROM teams
         WHERE team_id = $1 AND team_owner_id = $2`,
        [teamId, ownerId]
    );
    
    if (ownerCheck.rows.length === 0) {
        const error = new Error('Team not found or you are not the owner');
        error.code = 'TEAM_NOT_FOUND_OR_NOT_OWNER';
        throw error;
    }
    
    const deleteResult = await pool.query(
        `DELETE FROM teams
         WHERE team_id = $1 AND team_owner_id = $2`,
        [teamId, ownerId]
    );
    
    if (deleteResult.rowCount === 0) {
        const error = new Error('Failed to delete team');
        error.code = 'DELETE_FAILED';
        throw error;
    }
}

/**
 * Promote a team member to team lead (transfer ownership).
 * @param {number} teamId
 * @param {number} currentOwnerId - Current team owner (must be the one making the change)
 * @param {number} newOwnerId - User to promote to team lead
 * @returns {Promise<void>}
 */
export async function promoteToTeamLead(teamId, currentOwnerId, newOwnerId) {

    const ownerCheck = await pool.query(
        `SELECT team_name
         FROM teams
         WHERE team_id = $1 AND team_owner_id = $2`,
        [teamId, currentOwnerId]
    );
    
    if (ownerCheck.rows.length === 0) {
        const error = new Error('Team not found or you are not the current owner');
        error.code = 'TEAM_NOT_FOUND_OR_NOT_OWNER';
        throw error;
    }
    
    const memberCheck = await pool.query(
        `SELECT 1
         FROM user_teams
         WHERE team_id = $1 AND user_id = $2`,
        [teamId, newOwnerId]
    );
    
    if (memberCheck.rows.length === 0) {
        const error = new Error('User is not a member of this team');
        error.code = 'USER_NOT_TEAM_MEMBER';
        throw error;
    }
    
    const updateResult = await pool.query(
        `UPDATE teams
         SET team_owner_id = $1
         WHERE team_id = $2 AND team_owner_id = $3`,
        [newOwnerId, teamId, currentOwnerId]
    );
    
    if (updateResult.rowCount === 0) {
        const error = new Error('Failed to update team ownership');
        error.code = 'UPDATE_FAILED';
        throw error;
    }
}