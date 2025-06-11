import { pool } from './pool.js';
import { AppError } from 'common';
import z from 'zod/v4';
import pg from 'pg';

/**
 * Assign a role (by name) to a user.
 * @param {number} userId
 * @param {string} roleName
 */
export async function assignRole(userId, roleName) {
    const roleResult = await pool.query(
        'SELECT role_id FROM roles WHERE role_name = $1',
        [roleName]
    );
    if (roleResult.rows.length === 0) {
        throw new AppError({
            code: 'validation_error',
            status: 400,
            message: `Role '${roleName}' does not exist`,
            data: {
                errors: [`Role '${roleName}' does not exist`]
            }
        });
    }
    const roleId = roleResult.rows[0].role_id;

    try {
        await pool.query(
            'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
            [userId, roleId]
        );
    } catch (error) {
        if (error instanceof pg.DatabaseError && error.code === '23505') {
            throw new AppError({
                code: 'validation_error',
                status: 400,
                message: 'User already has this role.',
                data: {
                    errors: ['User already has this role.']
                }
            });
        }
        throw error;
    }
}

/**
 * Revoke a role (by name) from a user.
 * @param {number} userId
 * @param {string} roleName
 */
export async function revokeRole(userId, roleName) {
    const roleResult = await pool.query(
        'SELECT role_id FROM roles WHERE role_name = $1',
        [roleName]
    );
    if (roleResult.rows.length === 0) {
        throw new AppError({
            code: 'validation_error',
            status: 400,
            message: `Role '${roleName}' does not exist`,
            data: {
                errors: [`Role '${roleName}' does not exist`]
            }
        });
    }
    const roleId = roleResult.rows[0].role_id;

    const deleteResult = await pool.query(
        'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
        [userId, roleId]
    );
    if (deleteResult.rowCount === 0) {
        throw new AppError({
            code: 'validation_error',
            status: 400,
            message: 'User already has this role',
            data: {
                errors: ['User already has this role']
            }
        });
    }
}

/**
 * Get all roles assigned to a user.
 * @param {number} userId
 */
export async function getUserRoles(userId) {
    const result = await pool.query(
        `SELECT r.role_name
        FROM roles r
        JOIN user_roles ur ON r.role_id = ur.role_id
        WHERE ur.user_id = $1`,
        [userId]
    );
    return result.rows.map(row => z.string().parse(row.role_name));
}
