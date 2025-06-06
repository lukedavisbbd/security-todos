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
    deleteTask
} from '../db/task-queries.js';
import { authenticated, requireRole  } from '../middleware/auth-middleware.js';

const router = Router();

router.get('/user/:userId', requireRole('team_lead'), async (req, res, next) => {
    try {
        const userId = Number(req.params.userId);
        const tasks = await getTasksForUser(userId);
        res.json(tasks);
    } catch (
        /** @type {unknown} */ _error
    ) {
        /** @type {any} */ const error = _error;
        next(error);
    }
});

router.get('/team/:teamId', authenticated, async (req, res, next) => {
    try {
        const teamId = Number(req.params.teamId);
        if (isNaN(teamId)) {
            throw new AppError({
                code: 'validation_error',
                status: 400,
                message: 'Validation Error',
                data: {
                    errors: [
                        'Invalid team ID'
                    ]
                },
            });
        }
        const tasks = await getTasksForTeam(teamId);
        res.json(tasks);
    } catch (
        /** @type {unknown} */ _error
    ) {
        /** @type {any} */ const error = _error;
        next(error);
    }
});

router.get('/:id', authenticated, async (req, res, next) => {
    try {
        const taskId = Number(req.params.id);
        if (isNaN(taskId)) {
            throw new AppError({
                code: 'validation_error',
                status: 400,
                message: 'Validation Error',
                data: {
                    errors: [
                        'Invalid task ID'
                    ]
                },
            });
        }
        const task = await getTaskById(taskId);
        if (!task) {
            throw new AppError();
        }
        res.json(task);
    } catch (
        /** @type {unknown} */ _error
    ) {
        /** @type {any} */ const error = _error;
        next(error);
    }
});

router.post(
  '/',
  requireRole('team_lead'),
  async (req, res, next) => {
    try {
      const data = CreateTaskSchema.parse(req.body);

      const created = await createTask({
        teamId: data.teamId,
        assignedToId: data.assignedToId,
        statusId: data.statusId,
        name: data.name,
        content: data.content
      });
      res.status(201).json(created);
    } catch (
        /** @type {unknown} */ _error
    ) {
        /** @type {any} */ const error = _error;
      if (error.name === 'ZodError') {
        // Zod validation error
        return next(
            new AppError()
        );
      }
      return next(error);
    }
  }
);


router.put('/:id/status', authenticated, async (req, res, next) => {
    try {
        const taskId = Number(req.params.id);
        if (isNaN(taskId)) {
            throw new AppError({
                code: 'validation_error',
                status: 400,
                message: 'Validation Error',
                data: {
                    errors: [
                        'Invalid task ID'
                    ]
                },
            });
        }
        const { statusId } = UpdateStatusSchema.parse(req.body);
        await updateTaskStatus(taskId, statusId);
        res.json({ message: 'Status updated' });
    } catch (
        /** @type {unknown} */ _error
    ) {
        /** @type {any} */ const error = _error;
        if (error.name === 'ZodError') {
            return next(
                new AppError()
            );
        }
        next(error);
    }
});

router.put('/:id', authenticated, async (req, res, next) => {
    try {
        const taskId = Number(req.params.id);
        if (isNaN(taskId)) {
            throw new AppError({
                code: 'validation_error',
                status: 400,
                message: 'Validation Error',
                data: {
                    errors: [
                        'Invalid task ID'
                    ]
                },
            });
        }
        const { name, content } = UpdateTaskDetailsSchema.parse(req.body);
        await updateTaskDetails(taskId, name, content);
        res.json({ message: 'Task updated' });
    } catch (
        /** @type {unknown} */ _error
    ) {
        /** @type {any} */ const error = _error;
        if (error.name === 'ZodError') {
            return next(
                new AppError()
            );
        }
        next(error);
    }
});

router.put('/:id/assign', authenticated, async (req, res, next) => {
    try {
        const taskId = Number(req.params.id);
        if (isNaN(taskId)) {
            throw new AppError({
                code: 'validation_error',
                status: 400,
                message: 'Validation Error',
                data: {
                    errors: [
                        'Invalid task ID'
                    ]
                },
            });
        }
        const { userId } = AssignTaskSchema.parse(req.body);
        await assignTaskToUser(taskId, userId);
        res.json({ message: 'Task assigned' });
    } catch (
        /** @type {unknown} */ _error
    ) {
        /** @type {any} */ const error = _error;
        if (error.name === 'ZodError') {
            return next(
                new AppError()
            );
        }
        next(error);
    }
});

router.delete('/:id', authenticated, async (req, res, next) => {
    try {
        const taskId = Number(req.params.id);
        if (isNaN(taskId)) {
            throw new AppError({
                code: 'validation_error',
                status: 400,
                message: 'Validation Error',
                data: {
                    errors: [
                        'Invalid task ID'
                    ]
                },
            });
        }
        await deleteTask(taskId);
        res.json({ message: 'Task deleted' });
    } catch (
        /** @type {unknown} */ _error
    ) {
        /** @type {any} */ const error = _error;
        next(error);
    }
});

export default router;
