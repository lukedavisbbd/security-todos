import { apiFetch } from "./http";

/**
 * Get tasks for a specific user
 * @param {number} userId
 * @returns {Promise<import("./http").ApiResult<import('common').TaskWithAssignee[]> | null>}
 */
export const getTasksForUser = async (userId) => {
    return await apiFetch(`/tasks/user/${userId}`);
};

/**
 * Get tasks for a team
 * @param {number} teamId
 * @returns {Promise<import("./http").ApiResult<import('common').TaskWithAssignee[]> | null>}
 */
export const getTasksForTeam = async (teamId) => {
    return await apiFetch(`/tasks/team/${teamId}`);
};

/**
 * Get specific task
 * @param {number} taskId
 * @returns {Promise<import("./http").ApiResult<import('common').Task> | null>}
 */
export const getTaskById = async (taskId) => {
    return await apiFetch(`/tasks/${taskId}`);
};

/**
 * Create new task
 * @param {import('common').CreateTaskRequest} taskData
 * @returns {Promise<import("./http").ApiResult<import('common').Task> | null>}
 */
export const createTask = async (taskData) => {
    return await apiFetch('/tasks', 'POST', taskData);
};

/**
 * Update task status
 * @param {number} taskId
 * @param {number} statusId
 * @returns {Promise<import("./http").ApiResult<{message: string}> | null>}
 */
export const updateTaskStatus = async (taskId, statusId) => {
    return await apiFetch(`/tasks/${taskId}/status`, 'PUT', { statusId });
};

/**
 * Update task details
 * @param {number} taskId
 * @param {string} name
 * @param {string | undefined} content
 * @returns {Promise<import("./http").ApiResult<{message: string}> | null>}
 */
export const updateTaskDetails = async (taskId, name, content) => {
    return await apiFetch(`/tasks/${taskId}`, 'PUT', { name, content });
};

/**
 * Assign task to user
 * @param {number} taskId
 * @param {number} userId
 * @returns {Promise<import("./http").ApiResult<{message: string}> | null>}
 */
export const assignTaskToUser = async (taskId, userId) => {
    return await apiFetch(`/tasks/${taskId}/assign`, 'PUT', { userId });
};

/**
 * Delete task
 * @param {number} taskId
 * @returns {Promise<import("./http").ApiResult<{message: string}> | null>}
 */
export const deleteTask = async (taskId) => {
    return await apiFetch(`/tasks/${taskId}`, 'DELETE');
};

// Add this to frontend/src/util/tasks.js

/**
 * Get task history
 * @param {number} taskId
 * @returns {Promise<import("./http").ApiResult<Array<{
 *   history_id: number,
 *   task_id: number,
 *   status_id: number,
 *   status_name: string,
 *   assigned_to_id: number | null,
 *   assigned_to_name: string | null,
 *   assigned_to_email: string | null,
 *   timestamp: string
 * }>> | null>}
 */
export const getTaskHistory = async (taskId) => {
    return await apiFetch(`/tasks/${taskId}/history`);
};