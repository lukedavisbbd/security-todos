import { Router } from 'express';
import { AppError } from 'common';

import {
  createTeam,
  getTeamsLedByUser,
  getTeamsForUser,
  addUserToTeam,
  removeUserFromTeam,
  getUsersInTeam
} from '../db/team-queries.js';

import { authenticated, requireRole } from '../middleware/auth-middleware.js';
import { CreateTeamSchema, AddUserToTeamSchema } from '../../../common/src/models/team-models.js';

const router = Router();

/**
 * @param {import('express').Request & { user: {
 *   user_id: number;
 *   email: string;
 *   roles: string[];
 *   teamsLed: number[];
 *   teamsMemberOf: number[];
 * } }} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
router.post('/', requireRole('team_lead'), async (req, res, next) => {
  try {
    const { teamName } = CreateTeamSchema.parse(req.body);
    const ownerId = Number(req.params.userId);
    const newTeam = await createTeam(ownerId, teamName.trim());
    res.status(201).json(newTeam);
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

router.get('/lead', requireRole('team_lead'), async (req, res, next) => {
  try {
    const user_id = Number(req.params.userId);
    const teams = await getTeamsLedByUser(user_id);
    res.json(teams);
  } catch (
    /** @type {unknown} */ _error
  ) {
    /** @type {any} */ const error = _error;
    next(error);
  }
});

router.get('/user', authenticated, async (req, res, next) => {
  try {
    const user_id = Number(req.params.userId);
    const teams = await getTeamsForUser(user_id);
    res.json(teams);
  } catch (
    /** @type {unknown} */ _error
  ) {
    /** @type {any} */ const error = _error;
    next(error);
  }
});

router.post('/:teamId/users', requireRole('team_lead'), async (req, res, next) => {
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
    const { userId } = AddUserToTeamSchema.parse(req.body);
    await addUserToTeam(userId, teamId);
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

router.delete('/:teamId/users/:userId', requireRole('team_lead'), async (req, res, next) => {
  try {
    const teamId = Number(req.params.teamId);
    const userIdToRemove = Number(req.params.userId);
    if (isNaN(teamId) || isNaN(userIdToRemove)) {
      throw new AppError();
    }
    await removeUserFromTeam(userIdToRemove, teamId);
    res.status(204).send();
  } catch (
    /** @type {unknown} */ _error
  ) {
    /** @type {any} */ const error = _error;
    next(error);
  }
});

router.get('/:teamId/users', authenticated, async (req, res, next) => {
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
    const members = await getUsersInTeam(teamId);
    res.json(members);
  } catch (
    /** @type {unknown} */ _error
  ) {
    /** @type {any} */ const error = _error;
    next(error);
  }
});

export default router;
