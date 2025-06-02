import { AppError } from 'common';
import { Router } from 'express';
import {
    getTasksForUser,
    getTasksForTeam,
    getTaskById,
    createTask,
    updateTaskStatus,
    updateTaskDetails,
    assignTaskToUser,
    deleteTask
} from '../db/task-queries.js';
import { authenticated } from '../middleware/auth-middleware.js';
import {
  CreateTaskSchema,
  UpdateTaskDetailsSchema,
  UpdateStatusSchema,
  AssignTaskSchema,
} from '../../../common/src/models/task-models.js';

const router = Router();

router.get('/user', authenticated, async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const tasks = await getTasksForUser(userId);
        res.json(tasks);
    } catch (err) {
        next(err);
    }
});

router.get('/team/:teamId', authenticated, async (req, res, next) => {
    try {
        const teamId = Number(req.params.teamId);
        if (isNaN(teamId)) {
            throw new AppError('Invalid team ID', 400);
        }
        const tasks = await getTasksForTeam(teamId);
        res.json(tasks);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', authenticated, async (req, res, next) => {
    try {
        const taskId = Number(req.params.id);
        if (isNaN(taskId)) {
            throw new AppError('Invalid task ID', 400);
        }
        const task = await getTaskById(taskId);
        if (!task) {
            throw new AppError('Task not found', 404);
        }
        res.json(task);
    } catch (err) {
        next(err);
    }
});

router.post('/', authenticated, async (req, res, next) => {
    try {
        const validated = CreateTaskSchema.parse(req.body);
        const newTask = await createTask({
            teamId: validated.teamId,
            assignedToId: validated.assignedToId,
            statusId: validated.statusId,
            name: validated.name,
            content: validated.content,
        });
        res.status(201).json(newTask);
    } catch (err) {
        if (err.name === 'ZodError') {
            return next(new AppError(err.errors.map(e => e.message).join(', '), 400));
        }
        next(err);
    }
});

router.put('/:id/status', authenticated, async (req, res, next) => {
    try {
        const taskId = Number(req.params.id);
        if (isNaN(taskId)) {
            throw new AppError('Invalid task ID', 400);
        }
        const { statusId } = UpdateStatusSchema.parse(req.body);
        await updateTaskStatus(taskId, statusId);
        res.json({ message: 'Status updated' });
    } catch (err) {
        if (err.name === 'ZodError') {
            return next(new AppError(err.errors.map(e => e.message).join(', '), 400));
        }
        next(err);
    }
});

router.put('/:id', authenticated, async (req, res, next) => {
    try {
        const taskId = Number(req.params.id);
        if (isNaN(taskId)) {
            throw new AppError('Invalid task ID', 400);
        }
        const { name, content } = UpdateTaskDetailsSchema.parse(req.body);
        await updateTaskDetails(taskId, name, content);
        res.json({ message: 'Task updated' });
    } catch (err) {
        if (err.name === 'ZodError') {
            return next(new AppError(err.errors.map(e => e.message).join(', '), 400));
        }
        next(err);
    }
});

router.put('/:id/assign', authenticated, async (req, res, next) => {
    try {
        const taskId = Number(req.params.id);
        if (isNaN(taskId)) {
            throw new AppError('Invalid task ID', 400);
        }
        const { userId } = AssignTaskSchema.parse(req.body);
        await assignTaskToUser(taskId, userId);
        res.json({ message: 'Task assigned' });
    } catch (err) {
        if (err.name === 'ZodError') {
            return next(new AppError(err.errors.map(e => e.message).join(', '), 400));
        }
        next(err);
    }
});

router.delete('/:id', authenticated, async (req, res, next) => {
    try {
        const taskId = Number(req.params.id);
        if (isNaN(taskId)) {
            throw new AppError('Invalid task ID', 400);
        }
        await deleteTask(taskId);
        res.json({ message: 'Task deleted' });
    } catch (err) {
        next(err);
    }
});

export default router;
