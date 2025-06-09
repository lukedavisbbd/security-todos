import { 
    AppError, 
    CreateTaskSchema,
    UpdateTaskDetailsSchema,
    UpdateStatusSchema,
    AssignTaskSchema 
} from 'common';
import { Router } from 'express';
import {
    getTasksForTeam,
    getTaskById,
    createTask,
    updateTaskStatus,
    updateTaskDetails,
    assignTaskToUser,
    deleteTask,
    getTaskHistory
} from '../db/task-queries.js';
import { authenticated } from '../middleware/auth-middleware.js';
import { validate } from '../utils/validation.js';
import z from 'zod/v4';
import { TaskSearchQuerySchema } from '../models/queries.js';
import { assertTeamAccess, assertTeamOwner } from './team-routes.js';

const router = Router();

/**
 * Get tasks for a team with filtering and pagination
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.get('/tasks/team/:teamId', authenticated, async (req, res) => {
    const teamId = validate(z.coerce.number().int(), req.params.teamId);
    const authedReq = /** @type {import('../').AuthenticatedRequest} */(req);
    const currentUserId = authedReq.jwtContents.user.userId;

    let {
        page = 1,
        limit = 5,
        userId,
        statusId,
    } = validate(TaskSearchQuerySchema, req.query);
    
    await assertTeamAccess(teamId, currentUserId);

    const result = await getTasksForTeam(teamId, {
        userId,
        statusId,
        page,
        limit
    });

    res.json(result);
});

/**
 * Get specific task
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.get('/tasks/:id', authenticated, async (req, res) => {
    const taskId = validate(z.coerce.number().int(), req.params.id);
    const authedReq = /** @type {import('../').AuthenticatedRequest} */(req);
    const currentUserId = authedReq.jwtContents.user.userId;
    
    const task = await getTaskById(taskId);
    if (!task) {
        throw new AppError({
            code: 'not_found',
            status: 404,
            message: 'Task not found',
            data: undefined,
        });
    }

    await assertTeamAccess(task.teamId, currentUserId);

    res.json(task);
});

/**
 * Create new task 
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.post('/tasks', authenticated, async (req, res) => {
    const data = validate(CreateTaskSchema, req.body);
    const authedReq = /** @type {import('../').AuthenticatedRequest} */(req);
    const currentUserId = authedReq.jwtContents.user.userId;

    await assertTeamAccess(data.teamId, currentUserId);
    
    const created = await createTask({
        teamId: data.teamId,
        assignedToId: data.assignedToId,
        statusId: data.statusId,
        name: data.name,
        content: data.content
    });
    res.status(201).json(created);
});

/**
 * Update task status
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.put('/tasks/:id/status', authenticated, async (req, res) => {
    const taskId = validate(z.coerce.number().int(), req.params.id);
    const authedReq = /** @type {import('../').AuthenticatedRequest} */(req);
    const currentUserId = authedReq.jwtContents.user.userId;
    const { statusId } = validate(UpdateStatusSchema, req.body);

    const task = await getTaskById(taskId);
    if (!task) {
        throw new AppError({
            code: 'not_found',
            status: 404,
            message: 'Task not found',
            data: undefined,
        });
    }

    await assertTeamAccess(task.teamId, currentUserId);

    await updateTaskStatus(taskId, statusId);
    res.json({ message: 'Status updated' });
});

/**
 * Update task details
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.put('/tasks/:id', authenticated, async (req, res) => {
    const taskId = validate(z.coerce.number().int(), req.params.id);
    const authedReq = /** @type {import('../').AuthenticatedRequest} */(req);
    const currentUserId = authedReq.jwtContents.user.userId;
    const { name, content } = validate(UpdateTaskDetailsSchema, req.body);

    const task = await getTaskById(taskId);
    if (!task) {
        throw new AppError({
            code: 'not_found',
            status: 404,
            message: 'Task not found',
            data: undefined,
        });
    }

    await assertTeamAccess(task.teamId, currentUserId);

    await updateTaskDetails(taskId, name, content);
    res.json({ message: 'Task updated' });
});

/**
 * Assign task to user
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.put('/tasks/:id/assign', authenticated, async (req, res) => {
    const taskId = validate(z.coerce.number().int(), req.params.id);
    const authedReq = /** @type {import('../').AuthenticatedRequest} */(req);
    const currentUserId = authedReq.jwtContents.user.userId;
    const { userId } = validate(AssignTaskSchema, req.body);
    
    const task = await getTaskById(taskId);
    if (!task) {
        throw new AppError({
            code: 'not_found',
            status: 404,
            message: 'Task not found',
            data: undefined,
        });
    }

    await assertTeamAccess(task.teamId, currentUserId);

    await assignTaskToUser(taskId, userId);
    res.json({ message: 'Task assigned' });
});

/**
 * Delete task (only team owners can delete tasks)
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.delete('/tasks/:id', authenticated, async (req, res) => {
    const taskId = validate(z.coerce.number().int(), req.params.id);
    const authedReq = /** @type {import('../').AuthenticatedRequest} */(req);
    const currentUserId = authedReq.jwtContents.user.userId;
    
    const task = await getTaskById(taskId);
    if (!task) {
        throw new AppError({
            code: 'not_found',
            status: 404,
            message: 'Task not found',
            data: undefined,
        });
    }

    await assertTeamOwner(task.teamId, currentUserId);

    await deleteTask(taskId);
    res.json({ message: 'Task deleted' });
});

/**
 * Get task history
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.get('/tasks/:id/history', authenticated, async (req, res) => {
    const taskId = validate(z.coerce.number().int(), req.params.id);
    const authedReq = /** @type {import('../').AuthenticatedRequest} */(req);
    const currentUserId = authedReq.jwtContents.user.userId;

    const task = await getTaskById(taskId);
    if (!task) {
        throw new AppError({
            code: 'not_found',
            status: 404,
            message: 'Task not found',
            data: undefined,
        });
    }
    
    await assertTeamAccess(task.teamId, currentUserId);

    const history = await getTaskHistory(taskId);
    res.json(history);
});

export default router;