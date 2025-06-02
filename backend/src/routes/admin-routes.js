import { Router } from 'express';
import { AppError } from 'common';

import {
  assignRole,
  revokeRole,
  getUserRoles,
  getAllUsers
} from '../db/admin-queries.js';

import { authenticated } from '../middleware/auth-middleware.js';
import { RoleSchema } from '../../../common/src/models/admin-models.js';

const router = Router();

router.get('/users', authenticated, async (req, res, next) => {
  try {
    const current = req.user;
    if (!current.roles.includes('access_admin')) {
      throw new AppError('Forbidden: insufficient privileges', 403);
    }
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.get('/users/:userId/roles', authenticated, async (req, res, next) => {
  try {
    const current = req.user;
    if (!current.roles.includes('access_admin')) {
      throw new AppError('Forbidden: insufficient privileges', 403);
    }
    const userId = Number(req.params.userId);
    if (isNaN(userId) || userId <= 0) {
      throw new AppError('Invalid user ID', 400);
    }
    const roles = await getUserRoles(userId);
    res.json({ userId, roles });
  } catch (err) {
    next(err);
  }
});

router.post('/users/:userId/roles', authenticated, async (req, res, next) => {
  try {
    const current = req.user;
    if (!current.roles.includes('access_admin')) {
      throw new AppError('Forbidden: insufficient privileges', 403);
    }
    const userId = Number(req.params.userId);
    if (isNaN(userId) || userId <= 0) {
      throw new AppError('Invalid user ID', 400);
    }
    const { roleName } = RoleSchema.parse(req.body);
    await assignRole(userId, roleName);
    res.status(204).send();
  } catch (err) {
    if (err.name === 'ZodError') {
        return next(new AppError(err.errors.map(e => e.message).join(', '), 400));
    }
    next(err);
  }
});

router.delete('/users/:userId/roles', authenticated, async (req, res, next) => {
  try {
    const current = req.user;
    if (!current.roles.includes('access_admin')) {
      throw new AppError('Forbidden: insufficient privileges', 403);
    }
    const userId = Number(req.params.userId);
    if (isNaN(userId) || userId <= 0) {
      throw new AppError('Invalid user ID', 400);
    }
    const { roleName } = RoleSchema.parse(req.body);
    await revokeRole(userId, roleName);
    res.status(204).send();
  } catch (err) {
    if (err.name === 'ZodError') {
        return next(new AppError(err.errors.map(e => e.message).join(', '), 400));
    }
    next(err);
  }
});

export default router;
