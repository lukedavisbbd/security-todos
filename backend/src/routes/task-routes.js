import { 
    AppError, 
    CreateTaskSchema,
    UpdateTaskDetailsSchema,
    UpdateStatusSchema,
    AssignTaskSchema 
} from 'common';
import { Router } from 'express';
import {
    getTasksForUser,
    getTasksForTeam,
    getTaskById,
    createTask,
    updateTaskStatus,
    updateTaskDetails,
    assignTaskToUser,
    deleteTask,
    getTaskHistory
} from '../db/task-queries.js';
import { getTeamsForUser, isTeamOwner, getTeamById } from '../db/team-queries.js';
import { authenticated } from '../middleware/auth-middleware.js';

const router = Router();

/**
 * Check if user has access to team (is owner or member)
 * @param {number} teamId
 * @param {number} userId
 * @returns {Promise<boolean>}
 */
async function hasTeamAccess(teamId, userId) {
    const team = await getTeamById(teamId);
    if (!team) return false;
    
    if (team.team_owner_id === userId) return true;
    
    const userTeams = await getTeamsForUser(userId);
    return userTeams.some(t => t.team_id === teamId);
}

/**
 * Get tasks for a specific user
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.get('/user/:userId', authenticated, async (req, res) => {
    const targetUserId = Number(req.params.userId);
    // @ts-ignore - jwtContents is added by authenticated middleware
    const currentUserId = req.jwtContents.user.userId;
    
    if (isNaN(targetUserId)) {
        throw new AppError({
            code: 'validation_error',
            status: 400,
            message: 'Validation Error',
            data: {
                errors: ['Invalid user ID']
            },
        });
    }

    if (currentUserId !== targetUserId) {
        const currentUserTeams = await getTeamsForUser(currentUserId);
        const targetUserTeams = await getTeamsForUser(targetUserId);
        
        const isTeamOwnerOfTargetUser = currentUserTeams.some(currentTeam => {
            return targetUserTeams.some(targetTeam => 
                targetTeam.team_id === currentTeam.team_id && 
                currentTeam.team_owner_id === currentUserId
            );
        });

        if (!isTeamOwnerOfTargetUser) {
            throw new AppError({
                code: 'missing_role',
                status: 403,
                message: 'Not authorized to view these tasks',
                data: undefined,
            });
        }
    }

    const tasks = await getTasksForUser(targetUserId);
    res.json(tasks);
});

/**
 * Get tasks for a team with filtering and pagination
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.get('/team/:teamId', authenticated, async (req, res) => {
    const teamId = Number(req.params.teamId);
    // @ts-ignore - jwtContents is added by authenticated middleware
    const currentUserId = req.jwtContents.user.userId;
    
    if (isNaN(teamId)) {
        throw new AppError({
            code: 'validation_error',
            status: 400,
            message: 'Validation Error',
            data: {
                errors: ['Invalid team ID']
            },
        });
    }

    const hasAccess = await hasTeamAccess(teamId, currentUserId);
    if (!hasAccess) {
        throw new AppError({
            code: 'missing_role',
            status: 403,
            message: 'Not authorized to view team tasks',
            data: undefined,
        });
    }

    const userId = req.query.userId ? 
        (req.query.userId === 'null' ? null : Number(req.query.userId)) : 
        undefined;
    const statusId = req.query.statusId ? Number(req.query.statusId) : undefined;
    const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
    const limit = req.query.limit ? Math.min(20, Math.max(1, Number(req.query.limit))) : 10;

    if (req.query.userId && req.query.userId !== 'null' && (isNaN(userId) || userId < 1)) {
        throw new AppError({
            code: 'validation_error',
            status: 400,
            message: 'Invalid user ID parameter',
            data: {
                errors: ['User ID must be a positive number or null']
            },
        });
    }

    if (req.query.statusId && (isNaN(statusId) || statusId < 1)) {
        throw new AppError({
            code: 'validation_error',
            status: 400,
            message: 'Invalid status ID parameter',
            data: {
                errors: ['Status ID must be a positive number']
            },
        });
    }

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
router.get('/:id', authenticated, async (req, res) => {
    const taskId = Number(req.params.id);
    // @ts-ignore - jwtContents is added by authenticated middleware
    const currentUserId = req.jwtContents.user.userId;
    
    if (isNaN(taskId)) {
        throw new AppError({
            code: 'validation_error',
            status: 400,
            message: 'Validation Error',
            data: {
                errors: ['Invalid task ID']
            },
        });
    }

    const task = await getTaskById(taskId);
    if (!task) {
        throw new AppError({
            code: 'not_found',
            status: 404,
            message: 'Task not found',
            data: undefined,
        });
    }

    const hasAccess = await hasTeamAccess(task.team_id, currentUserId);
    if (!hasAccess) {
        throw new AppError({
            code: 'missing_role',
            status: 403,
            message: 'Not authorized to view this task',
            data: undefined,
        });
    }

    res.json(task);
});

/**
 * Create new task 
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.post('/', authenticated, async (req, res) => {
    const data = CreateTaskSchema.parse(req.body);
    // @ts-ignore - jwtContents is added by authenticated middleware
    const currentUserId = req.jwtContents.user.userId;

    const isTeamMember = await hasTeamAccess(data.teamId, currentUserId);
    if (!isTeamMember) {
        throw new AppError({
            code: 'missing_role',
            status: 403,
            message: 'Only team owners can create tasks',
            data: undefined,
        });
    }

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
router.put('/:id/status', authenticated, async (req, res) => {
    const taskId = Number(req.params.id);
    // @ts-ignore - jwtContents is added by authenticated middleware
    const currentUserId = req.jwtContents.user.userId;
    
    if (isNaN(taskId)) {
        throw new AppError({
            code: 'validation_error',
            status: 400,
            message: 'Validation Error',
            data: {
                errors: ['Invalid task ID']
            },
        });
    }

    const task = await getTaskById(taskId);
    if (!task) {
        throw new AppError({
            code: 'not_found',
            status: 404,
            message: 'Task not found',
            data: undefined,
        });
    }

    const hasAccess = await hasTeamAccess(task.team_id, currentUserId);
    if (!hasAccess) {
        throw new AppError({
            code: 'missing_role',
            status: 403,
            message: 'Not authorized to update this task',
            data: undefined,
        });
    }

    const { statusId } = UpdateStatusSchema.parse(req.body);
    await updateTaskStatus(taskId, statusId);
    res.json({ message: 'Status updated' });
});

/**
 * Update task details
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.put('/:id', authenticated, async (req, res) => {
    const taskId = Number(req.params.id);
    // @ts-ignore - jwtContents is added by authenticated middleware
    const currentUserId = req.jwtContents.user.userId;
    
    if (isNaN(taskId)) {
        throw new AppError({
            code: 'validation_error',
            status: 400,
            message: 'Validation Error',
            data: {
                errors: ['Invalid task ID']
            },
        });
    }

    const task = await getTaskById(taskId);
    if (!task) {
        throw new AppError({
            code: 'not_found',
            status: 404,
            message: 'Task not found',
            data: undefined,
        });
    }

    const hasAccess = await hasTeamAccess(task.team_id, currentUserId);
    if (!hasAccess) {
        throw new AppError({
            code: 'missing_role',
            status: 403,
            message: 'Not authorized to update this task',
            data: undefined,
        });
    }

    const { name, content } = UpdateTaskDetailsSchema.parse(req.body);
    await updateTaskDetails(taskId, name, content);
    res.json({ message: 'Task updated' });
});

/**
 * Assign task to user
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.put('/:id/assign', authenticated, async (req, res) => {
    const taskId = Number(req.params.id);
    // @ts-ignore - jwtContents is added by authenticated middleware
    const currentUserId = req.jwtContents.user.userId;
    
    if (isNaN(taskId)) {
        throw new AppError({
            code: 'validation_error',
            status: 400,
            message: 'Validation Error',
            data: {
                errors: ['Invalid task ID']
            },
        });
    }

    const task = await getTaskById(taskId);
    if (!task) {
        throw new AppError({
            code: 'not_found',
            status: 404,
            message: 'Task not found',
            data: undefined,
        });
    }

    const hasAccess = await hasTeamAccess(task.team_id, currentUserId);
    if (!hasAccess) {
        throw new AppError({
            code: 'missing_role',
            status: 403,
            message: 'Not authorized to assign this task',
            data: undefined,
        });
    }

    const { userId } = AssignTaskSchema.parse(req.body);
    await assignTaskToUser(taskId, userId);
    res.json({ message: 'Task assigned' });
});

/**
 * Delete task (only team owners can delete tasks)
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.delete('/:id', authenticated, async (req, res) => {
    const taskId = Number(req.params.id);
    // @ts-ignore - jwtContents is added by authenticated middleware
    const currentUserId = req.jwtContents.user.userId;
    
    if (isNaN(taskId)) {
        throw new AppError({
            code: 'validation_error',
            status: 400,
            message: 'Validation Error',
            data: {
                errors: ['Invalid task ID']
            },
        });
    }

    const task = await getTaskById(taskId);
    if (!task) {
        throw new AppError({
            code: 'not_found',
            status: 404,
            message: 'Task not found',
            data: undefined,
        });
    }

    const isOwner = await isTeamOwner(task.team_id, currentUserId);
    if (!isOwner) {
        throw new AppError({
            code: 'missing_role',
            status: 403,
            message: 'Only team owners can delete tasks',
            data: undefined,
        });
    }

    await deleteTask(taskId);
    res.json({ message: 'Task deleted' });
});

/**
 * Get task history
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.get('/:id/history', authenticated, async (req, res) => {
    const taskId = Number(req.params.id);
    // @ts-ignore - jwtContents is added by authenticated middleware
    const currentUserId = req.jwtContents.user.userId;
    
    if (isNaN(taskId)) {
        throw new AppError({
            code: 'validation_error',
            status: 400,
            message: 'Validation Error',
            data: {
                errors: ['Invalid task ID']
            },
        });
    }

    const task = await getTaskById(taskId);
    if (!task) {
        throw new AppError({
            code: 'not_found',
            status: 404,
            message: 'Task not found',
            data: undefined,
        });
    }
    
    const isOwner = await isTeamOwner(task.team_id, currentUserId);
    const hasAccess = await hasTeamAccess(task.team_id, currentUserId);
    
    if (!hasAccess && !isOwner) {
        throw new AppError({
            code: 'missing_role',
            status: 403,
            message: 'Not authorized to view this task history',
            data: undefined,
        });
    }

    const history = await getTaskHistory(taskId);
    res.json(history);
});

export default router;