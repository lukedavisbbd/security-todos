import { pool } from './pool.js';
import { AppError } from 'common';

/**
 * Assign a role (by name) to a user.
 * @param {number} userId
 * @param {string} roleName
 * @returns {Promise<void>}
 */
export async function assignRole(userId, roleName) {
    const roleResult = await pool.query(
        'SELECT role_id FROM roles WHERE role_name = $1',
        [roleName]
    );
    if (roleResult.rows.length === 0) {
        throw new AppError(`Role '${roleName}' does not exist`, 400);
    }
    const roleId = roleResult.rows[0].role_id;

    try {
        await pool.query(
            'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
            [userId, roleId]
        );
    } catch (err) {
        if (err.code === '23505') {
            throw new AppError('User already has this role', 400);
        }
        throw err;
    }
}

/**
 * Revoke a role (by name) from a user.
 * @param {number} userId
 * @param {string} roleName
 * @returns {Promise<void>}
 */
export async function revokeRole(userId, roleName) {
    const roleResult = await pool.query(
        'SELECT role_id FROM roles WHERE role_name = $1',
        [roleName]
    );
    if (roleResult.rows.length === 0) {
        throw new AppError(`Role '${roleName}' does not exist`, 400);
    }
    const roleId = roleResult.rows[0].role_id;

    const deleteResult = await pool.query(
        'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
        [userId, roleId]
    );
    if (deleteResult.rowCount === 0) {
        throw new AppError('User does not have this role', 400);
    }
}

/**
 * Get all roles assigned to a user.
 * @param {number} userId
 * @returns {Promise<Array<string>>}
 */
export async function getUserRoles(userId) {
    const result = await pool.query(
        `SELECT r.role_name
         FROM roles r
         JOIN user_roles ur ON r.role_id = ur.role_id
         WHERE ur.user_id = $1`,
        [userId]
    );
    return result.rows.map(row => row.role_name);
}

/**
 * Get all users (ID and email).
 * @returns {Promise<Array<Object>>}
 */
export async function getAllUsers() {
    const result = await pool.query(
        'SELECT user_id, email FROM users'
    );
    return result.rows;
}
