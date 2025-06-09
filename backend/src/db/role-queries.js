import { pool } from './pool.js';
import z from 'zod/v4';

export const fetchRoles = async () => {
    const result = await pool.query('SELECT role_name FROM roles ORDER BY role_name');

    /** @type {string[]} */
    const roles = result.rows.map(row => z.string().parse(row.role_name));
    return roles;
};
