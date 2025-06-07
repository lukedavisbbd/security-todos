import { pool } from './pool.js';

export const fetchRoles = async () => {
    const result = await pool.query('SELECT role_name FROM roles ORDER BY role_name');

    /** @type {string[]} */
    const roles = result.rows.map(row => row.role_name);
    return roles;
};
