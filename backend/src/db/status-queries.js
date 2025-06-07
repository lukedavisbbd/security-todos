import { pool } from './pool.js';

/**
 * Get all available task statuses.
 * @returns {Promise<Array<{ status_id: number, status_name: string }>>}
 */
export async function getAllStatuses() {
    const result = await pool.query(
        'SELECT status_id, status_name FROM statuses ORDER BY status_name'
    );
    return result.rows;
}