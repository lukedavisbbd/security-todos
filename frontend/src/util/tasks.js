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
 * Get tasks for a team with optional filtering and pagination
 * @param {number} teamId
 * @param {Object} [options] - Filtering and pagination options
 * @param {number|null} [options.userId] - Filter by assigned user (null for unassigned)
 * @param {number} [options.statusId] - Filter by status
 * @param {number} [options.page=1] - Page number (1-based)
 * @param {number} [options.limit=10] - Items per page
 * @returns {Promise<import("./http").ApiResult<{tasks: import('common').TaskWithAssignee[], pagination: {currentPage: number, totalPages: number, totalItems: number, itemsPerPage: number}}> | null>}
 */
export const getTasksForTeam = async (teamId, options = {}) => {
    const searchParams = new URLSearchParams();
    
    if (options.userId !== undefined) {
        searchParams.append('userId', options.userId === null ? 'null' : options.userId.toString());
    }
    
    if (options.statusId !== undefined) {
        searchParams.append('statusId', options.statusId.toString());
    }
    
    if (options.page !== undefined) {
        searchParams.append('page', options.page.toString());
    }
    
    if (options.limit !== undefined) {
        searchParams.append('limit', options.limit.toString());
    }
    
    const queryString = searchParams.toString();
    const url = `/tasks/team/${teamId}${queryString ? `?${queryString}` : ''}`;
    
    return await apiFetch(url);
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