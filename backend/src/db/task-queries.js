import { HistorySchema, TaskSchema } from 'common';
import { pool } from './pool.js';

/**
 * Get all tasks for a specific team with filtering and pagination.
 * @param {number} teamId
 * @param {{
 *     userId?: number | null,
 *     statusId?: number,
 *     page?: number,
 *     limit?: number,
 * }} options - Filtering and pagination options
 */
export async function getTasksForTeam(teamId, options = {}) {
    const {
        userId,
        statusId,
        page = 1,
        limit = 5,
    } = options;

    const conditions = ['team_id = $1'];
    const params = [teamId];
    let paramIndex = 2;

    if (userId !== undefined) {
        if (userId === null) {
            conditions.push('assigned_to_id IS NULL');
        } else {
            conditions.push(`assigned_to_id = $${paramIndex}`);
            params.push(userId);
            paramIndex++;
        }
    }

    if (statusId !== undefined) {
        conditions.push(`status_id = $${paramIndex}`);
        params.push(statusId);
        paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const countQuery = `
        SELECT COUNT(*) AS total FROM tasks WHERE ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;

    const tasksQuery = `
        SELECT
            task_id, team_id, status_id,
            assigned_to_id, task_name, task_content
        FROM tasks
        WHERE ${whereClause}
        ORDER BY task_id
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    const tasksResult = await pool.query(tasksQuery, params);

    const mappedTasks = tasksResult.rows.map(row => {
        return {
            taskId: row.task_id,
            teamId: row.team_id,
            statusId: row.status_id,
            assignedToId: row.assigned_to_id,
            taskName: row.task_name,
            taskContent: row.task_content,
        };
    });

    const tasks = TaskSchema.array().parse(mappedTasks);

    return {
        tasks,
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
 */
export async function getTaskById(taskId) {
    const result = await pool.query(
        `SELECT
            task_id, task_name, task_content,
            status_id, assigned_to_id, team_id
        FROM tasks
        WHERE task_id = $1`,
        [taskId]
    );

    const row = result.rows[0];
    const task = row ? {
        taskId: row.task_id,
        teamId: row.team_id,
        statusId: row.status_id,
        assignedToId: row.assigned_to_id,
        taskName: row.task_name,
        taskContent: row.task_content,
    } : null;

    return TaskSchema.nullable().parse(task);
}

/**
 * Create a new task.
 * @param {import('common').CreateTaskRequest} task
 */
export async function createTask({ teamId, assignedToId, statusId, name, content }) {
    const result = await pool.query(
        `INSERT INTO tasks (team_id, assigned_to_id, status_id, task_name, task_content)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
            task_id, team_id, assigned_to_id,
            status_id, task_name, task_content`,
        [teamId, assignedToId, statusId, name, content]
    );

    const row = result.rows[0];
    const task = {
        taskId: row.task_id,
        teamId: row.team_id,
        assignedToId: row.assigned_to_id,
        statusId: row.status_id,
        taskName: row.task_name,
        taskContent: row.task_content,
    };

    return TaskSchema.parse(task);
}

/**
 * Update the status of a task.
 * @param {number} taskId
 * @param {number} statusId
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
 */
export async function getTaskHistory(taskId) {
    const result = await pool.query(
        `SELECT
            history_id,
            task_id,
            status_id,
            assigned_to_id,
            timestamp
        FROM history WHERE task_id = $1
        ORDER BY timestamp`,
        [taskId]
    );

    const histories = result.rows.map(row => {
        return {
            historyId: row.history_id,
            taskId: row.task_id,
            statusId: row.status_id,
            assignedToId: row.assigned_to_id,
            timestamp: row.timestamp,
        };
    });

    return HistorySchema.array().parse(histories);
}