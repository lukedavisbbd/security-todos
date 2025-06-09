import { HistorySchema, PaginationInfoSchema, TaskSchema } from "common";
import { apiFetch } from "./http";
import { z } from "zod/v4";

/**
 * Get tasks for a team with optional filtering and pagination
 * @param {number} teamId
 * @param {Object} [options] - Filtering and pagination options
 * @param {number|null} [options.userId] - Filter by assigned user (null for unassigned)
 * @param {number} [options.statusId] - Filter by status
 * @param {number} [options.page=1] - Page number (1-based)
 * @param {number} [options.limit=10] - Items per page
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
        searchParams.append('page', Math.max(options.page, 1).toString());
    }
    
    if (options.limit !== undefined) {
        searchParams.append('limit', options.limit.toString());
    }
    
    const queryString = searchParams.toString();
    const url = `/tasks/team/${teamId}${queryString ? `?${queryString}` : ''}`;
    
    const result = await apiFetch(url);

    return z.object({
        tasks: TaskSchema.array(),
        pagination: PaginationInfoSchema,
    }).parse(result);
};

/**
 * Get specific task
 * @param {number} taskId
 */
export const getTaskById = async (taskId) => {
    const task = await apiFetch(`/tasks/${taskId}`);
    return TaskSchema.nullable().parse(task);
};

/**
 * Create new task
 * @param {import('common').CreateTaskRequest} taskData
 */
export const createTask = async (taskData) => {
    const task = await apiFetch('/tasks', 'POST', taskData);
    return TaskSchema.parse(task);
};

/**
 * Update task status
 * @param {number} taskId
 * @param {number} statusId
 */
export const updateTaskStatus = async (taskId, statusId) => {
    await apiFetch(`/tasks/${taskId}/status`, 'PUT', { statusId });
};

/**
 * Update task details
 * @param {number} taskId
 * @param {string} name
 * @param {string | undefined} content
 */
export const updateTaskDetails = async (taskId, name, content) => {
    await apiFetch(`/tasks/${taskId}`, 'PUT', { name, content });
};

/**
 * Assign task to user
 * @param {number} taskId
 * @param {number | null} userId
 */
export const assignTaskToUser = async (taskId, userId) => {
    await apiFetch(`/tasks/${taskId}/assign`, 'PUT', { userId });
};

/**
 * Delete task
 * @param {number} taskId
 */
export const deleteTask = async (taskId) => {
    await apiFetch(`/tasks/${taskId}`, 'DELETE');
};

/**
 * Get task history
 * @param {number} taskId
 */
export const getTaskHistory = async (taskId) => {
    const histories = await apiFetch(`/tasks/${taskId}/history`);
    return HistorySchema.array().parse(histories);
};