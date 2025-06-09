import { StatusSchema } from 'common';
import { pool } from './pool.js';

/**
 * Get all available task statuses.
 */
export async function getAllStatuses() {
    const result = await pool.query(
        'SELECT status_id, status_name FROM statuses ORDER BY status_name'
    );
    
    const statuses = result.rows.map(row => {
        return {
            statusId: row.status_id,
            statusName: row.status_name,
        };
    });
    return StatusSchema.array().parse(statuses);
}