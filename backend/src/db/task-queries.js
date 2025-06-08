import { pool } from './pool.js';

/**
 * Get all tasks assigned to a specific user.
 * @param {number} userId
 * @returns {Promise<import('common').Task[]>}
 */
export async function getTasksForUser(userId) {
    const result = await pool.query(
        `SELECT task_id team_id, status_id, assigned_to_id, task_name, task_content
        FROM tasks
        WHERE t.assigned_to_id = $1
        ORDER BY t.task_id`,
        [userId]
    );
    return result.rows;
}

/**
 * Get all tasks for a specific team with filtering and pagination.
 * @param {number} teamId
 * @param {Object} options - Filtering and pagination options
 * @param {number|null} [options.userId] - Filter by assigned user (null for unassigned)
 * @param {number} [options.statusId] - Filter by status
 * @param {number} [options.page=1] - Page number (1-based)
 * @param {number} [options.limit=10] - Items per page
 * @returns {Promise<{tasks: import('common').Task[], pagination: {currentPage: number, totalPages: number, totalItems: number, itemsPerPage: number}}>}
 */
export async function getTasksForTeam(teamId, options = {}) {
    const {
        userId,
        statusId,
        page = 1,
        limit = 10
    } = options;

    const conditions = ['t.team_id = $1'];
    const params = [teamId];
    let paramIndex = 2;

    if (userId !== undefined) {
        if (userId === null) {
            conditions.push('t.assigned_to_id IS NULL');
        } else {
            conditions.push(`t.assigned_to_id = $${paramIndex}`);
            params.push(userId);
            paramIndex++;
        }
    }

    if (statusId !== undefined) {
        conditions.push(`t.status_id = $${paramIndex}`);
        params.push(statusId);
        paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const countQuery = `
        SELECT COUNT(*) as total
        FROM tasks t
        JOIN statuses s ON t.status_id = s.status_id
        LEFT JOIN users u ON t.assigned_to_id = u.user_id
        WHERE ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;

    const tasksQuery = `
        SELECT task_id team_id, status_id, assigned_to_id, task_name, task_content
        FROM tasks
        WHERE ${whereClause}
        ORDER BY t.task_id
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    const tasksResult = await pool.query(tasksQuery, params);

    return {
        tasks: tasksResult.rows,
        pagination: {
            currentPage: page,
            totalPages,
            totalItems,
            itemsPerPage: limit
        }
    };
}

/**
 * Get a specific task by its ID.
 * @param {number} taskId
 * @returns {Promise<import('common').Task | null>}
 */
export async function getTaskById(taskId) {
    const result = await pool.query(
        `SELECT t.task_id, t.task_name, t.task_content, t.status_id, s.status_name, t.assigned_to_id, t.team_id
         FROM tasks t
         JOIN statuses s ON t.status_id = s.status_id
         WHERE t.task_id = $1`,
        [taskId]
    );
    return result.rows[0] || null;
}

/**
 * Create a new task.
 * @param {import('common').CreateTaskRequest} task
 * @returns {Promise<import('common').Task>}
 */
export async function createTask({ teamId, assignedToId, statusId, name, content }) {
    const result = await pool.query(
        `INSERT INTO tasks (team_id, assigned_to_id, status_id, task_name, task_content)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING task_id, team_id, assigned_to_id, status_id, task_name, task_content`,
        [teamId, assignedToId, statusId, name, content]
    );
    return result.rows[0];
}

/**
 * Update the status of a task.
 * @param {number} taskId
 * @param {number} statusId
 * @returns {Promise<void>}
 */
export async function updateTaskStatus(taskId, statusId) {
    await pool.query(
        `UPDATE tasks SET status_id = $1 WHERE task_id = $2`,
        [statusId, taskId]
    );
}

/**
 * Update task name and content.
 * @param {number} taskId
 * @param {string} name
 * @param {string | undefined} content
 * @returns {Promise<void>}
 */
export async function updateTaskDetails(taskId, name, content) {
    await pool.query(
        `UPDATE tasks SET task_name = $1, task_content = $2 WHERE task_id = $3`,
        [name, content, taskId]
    );
}

/**
 * Assign a task to a specific user.
 * @param {number} taskId
 * @param {number | null} userId
 * @returns {Promise<void>}
 */
export async function assignTaskToUser(taskId, userId) {
    await pool.query(
        `UPDATE tasks SET assigned_to_id = $1 WHERE task_id = $2`,
        [userId, taskId]
    );
}

/**
 * Delete a task by its ID.
 * @param {number} taskId
 * @returns {Promise<void>}
 */
export async function deleteTask(taskId) {
    await pool.query(
        `DELETE FROM tasks WHERE task_id = $1`,
        [taskId]
    );
}

/**
 * Get task history with status and user information
 * @param {number} taskId
 * @returns {Promise<Array<{
 *   history_id: number,
 *   task_id: number,
 *   status_id: number,
 *   status_name: string,
 *   assigned_to_id: number | null,
 *   assigned_to_name: string | null,
 *   assigned_to_email: string | null,
 *   timestamp: Date
 * }>>}
 */
export async function getTaskHistory(taskId) {
    const result = await pool.query(
        `SELECT 
            h.history_id,
            h.task_id,
            h.status_id,
            s.status_name,
            h.assigned_to_id,
            u.name as assigned_to_name,
            u.email as assigned_to_email,
            h.timestamp
         FROM history h
         JOIN statuses s ON h.status_id = s.status_id
         LEFT JOIN users u ON h.assigned_to_id = u.user_id
         WHERE h.task_id = $1
         ORDER BY h.timestamp ASC`,
        [taskId]
    );
    return result.rows;
}