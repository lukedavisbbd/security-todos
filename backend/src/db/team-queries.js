import { AppError, PublicUserSchema, TeamSchema, TeamWithStatsSchema } from 'common';
import { pool } from './pool.js';

/**
 * Create a new team with a given owner (team lead).
 * @param {number} ownerId
 * @param {string} teamName
 */
export async function createTeam(ownerId, teamName) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const numTeams = await client.query(
            `SELECT COUNT(*) AS count FROM teams WHERE team_owner_id = $1`,
            [ownerId],
        );

        const count = numTeams.rows[0]?.count ?? 0;

        const maxTeams = 20;

        if (count >= maxTeams) {
            throw new AppError({
                code: 'bad_request',
                status: 400,
                message: `You may not create more than ${maxTeams} teams`,
                data: undefined,
            });
        }

        const teamResult = await client.query(
            `INSERT INTO teams (team_name, team_owner_id)
            VALUES ($1, $2)
            RETURNING team_id, team_name, team_owner_id`,
            [teamName, ownerId]
        );

        const row = teamResult.rows[0];
        const team = TeamSchema.parse({
            teamId: row.team_id,
            teamName: row.team_name,
            teamOwnerId: row.team_owner_id,
        });

        await client.query(
            `INSERT INTO user_teams (user_id, team_id)
             VALUES ($1, $2)`,
            [ownerId, team.teamId]
        );

        await client.query('COMMIT');

        return TeamSchema.parse(team);
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
 */
export async function getTeamsWithStats(userId) {
    const result = await pool.query(
        `SELECT
            t.team_id,
            t.team_name,
            t.team_owner_id,
            (SELECT COUNT(*)::int AS member_count FROM user_teams WHERE user_teams.team_id = t.team_id),
            (SELECT COUNT(*)::int AS task_count FROM tasks WHERE tasks.team_id = t.team_id)
        FROM teams AS t
        WHERE t.team_owner_id = $1 OR t.team_id IN (SELECT team_id FROM user_teams WHERE user_id = $1)
        ORDER BY t.team_name`,
        [userId]
    );
    
    const teams = result.rows.map(row => {
        return {
            teamId: row.team_id,
            teamName: row.team_name,
            teamOwnerId: row.team_owner_id,
            memberCount: row.member_count,
            taskCount: row.task_count,
        };
    });
    return TeamWithStatsSchema.array().parse(teams);
}

/**
 * Get all teams led by a specific user.
 * @param {number} ownerId
 */
export async function getTeamsLedByUser(ownerId) {
    const result = await pool.query(
        `SELECT team_id, team_name, team_owner_id FROM teams
        WHERE teamOwnerId = $1 ORDER BY teamName`,
        [ownerId]
    );
    const teams = result.rows.map(row => {
        return {
            teamId: row.team_id,
            teamName: row.team_name,
            teamOwnerId: row.team_owner_id,
        };
    });
    return TeamSchema.array().parse(teams);
}

/**
 * Add a user to a team.
 * @param {number} userId
 * @param {number} teamId
 */
export async function addUserToTeam(userId, teamId) {
    const countResult = await pool.query(
        `SELECT COUNT(*)::int as member_count
        FROM user_teams
        WHERE team_id = $1`,
        [teamId]
    );

    const currentMemberCount = parseInt(countResult.rows[0].member_count);

    if (currentMemberCount >= 10) {
        throw new AppError({
            code: 'bad_request',
            status: 400,
            message: 'Team has reached maximum capacity of 10 members.',
            data: undefined,
        });
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
        
        if (await isTeamOwner(teamId, userId)) {
            throw new AppError({
                code: 'bad_request',
                status: 400,
                message: 'Cannot remove owner of team!',
                data: undefined,
            });
        }

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
 */
export async function getTeamsForUser(userId) {
    const result = await pool.query(
        `SELECT t.team_id, t.team_name, t.team_owner_id FROM teams AS t
        JOIN user_teams AS ut ON t.team_id = ut.team_id
        WHERE ut.user_id = $1 ORDER BY t.team_name`,
        [userId]
    );
    const teams = result.rows.map(row => {
        return {
            teamId: row.team_id,
            teamName: row.team_name,
            teamOwnerId: row.team_owner_id,
        };
    });
    return TeamSchema.array().parse(teams);
}

/**
 * Get all users who are members of a specific team.
 * @param {number} teamId
 */
export async function getUsersInTeam(teamId) {
    const result = await pool.query(
        `SELECT u.user_id, u.name 
        FROM users AS u
        JOIN user_teams AS ut ON u.user_id = ut.user_id
        WHERE ut.team_id = $1
        ORDER BY u.name`,
        [teamId]
    );
    const users = result.rows.map(row => {
        return {
            userId: row.user_id,
            name: row.name,
        };
    });
    return PublicUserSchema.array().parse(users);
}

/**
 * Get team by ID.
 * @param {number} teamId
 */
export async function getTeamById(teamId) {
    const result = await pool.query(
        `SELECT
            t.team_id,
            t.team_name,
            t.team_owner_id,
            (SELECT COUNT(*)::int AS member_count FROM user_teams WHERE user_teams.team_id = t.team_id),
            (SELECT COUNT(*)::int AS task_count FROM tasks WHERE tasks.team_id = t.team_id)
        FROM teams AS t WHERE team_id = $1`,
        [teamId]
    );

    const row = result.rows[0];
    const team = row ? {
        teamId: row.team_id,
        teamName: row.team_name,
        teamOwnerId: row.team_owner_id,
        memberCount: row.member_count,
        taskCount: row.task_count,
    } : null;

    return TeamWithStatsSchema.nullable().parse(team);
}

/**
 * Check if user is team owner.
 * @param {number} teamId
 * @param {number} userId
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
 * Promote a team member to team lead (transfer ownership).
 * @param {number} teamId
 * @param {number} newOwnerId
 */
export async function promoteToTeamLead(teamId, newOwnerId) {
    const memberCheck = await pool.query(
        `SELECT 1 FROM user_teams WHERE team_id = $1 AND user_id = $2`,
        [teamId, newOwnerId]
    );

    if (memberCheck.rows.length === 0) {
        throw new AppError({
            code: 'bad_request',
            status: 400,
            message: 'New owner is not a member of this team.',
            data: undefined,
        });
    }

    const updateResult = await pool.query(
        `UPDATE teams
        SET team_owner_id = $1
        WHERE team_id = $2`,
        [newOwnerId, teamId]
    );

    if (updateResult.rowCount === 0) {
        throw new Error('Failed to update team ownership');
    }
}

/**
 * Delete a team and all associated data (cascades handle tasks, history, user_teams).
 * @param {number} teamId
 * @returns {Promise<boolean>}
 */
export async function deleteTeam(teamId) {
    const result = await pool.query(
        `DELETE FROM teams WHERE team_id = $1`,
        [teamId]
    );

    return (result.rowCount ?? 0) > 0;
}
