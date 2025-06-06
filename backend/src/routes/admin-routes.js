import { Router } from 'express';
import { AppError } from 'common';

import {
  assignRole,
  revokeRole,
  getUserRoles,
  getAllUsers
} from '../db/admin-queries.js';

import { authenticated, requireRole } from '../middleware/auth-middleware.js';
import { RoleSchema } from '../../../common/src/models/admin-models.js';

const router = Router();

/**
 * @param {import('src').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.get('/users', requireRole('access_admin'), async (req, res, next) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (
    /** @type {unknown} */ _error
  ) {
    /** @type {any} */ const error = _error;
    next(error);
  }
});

router.get('/users/:userId/roles', requireRole('access_admin'), async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    if (isNaN(userId) || userId <= 0) {
      throw new AppError({
          code: 'validation_error',
          status: 400,
          message: 'Validation Error',
          data: {
              errors: [
                  'Invalid user ID'
              ]
          },
      });
    }
    const roles = await getUserRoles(userId);
    res.json({ userId, roles });
  } catch (
      /** @type {unknown} */ _error
  ) {
    /** @type {any} */ const error = _error;
    next(error);
  }
});

router.post('/users/:userId/roles', requireRole('access_admin'), async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    if (isNaN(userId) || userId <= 0) {
      throw new AppError({
          code: 'validation_error',
          status: 400,
          message: 'Validation Error',
          data: {
              errors: [
                  'Invalid user ID'
              ]
          },
      });
    }
    const { roleName } = RoleSchema.parse(req.body);
    await assignRole(userId, roleName);
    res.status(204).send();
  } catch (
        /** @type {unknown} */ _error
    ) {
        /** @type {any} */ const error = _error;
    if (error.name === 'ZodError') {
      throw new AppError();
    }
    next(error);
  }
});

router.delete('/users/:userId/roles', requireRole('access_admin'), async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    if (isNaN(userId) || userId <= 0) {
      throw new AppError({
          code: 'validation_error',
          status: 400,
          message: 'Validation Error',
          data: {
              errors: [
                  'Invalid user ID'
              ]
          },
      });
    }
    const { roleName } = RoleSchema.parse(req.body);
    await revokeRole(userId, roleName);
    res.status(204).send();
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

export default router;
