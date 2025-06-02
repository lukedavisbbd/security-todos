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

import { authenticated } from '../middleware/auth-middleware.js';
import { CreateTeamSchema, AddUserToTeamSchema } from '../../../common/src/models/team-models.js';

const router = Router();

async function isUserTeamLead(user, teamId) {
  if (user.roles.includes('access_admin')) return true;
  const teams = await getTeamsLedByUser(user.user_id);
  return teams.some((team) => team.team_id === teamId);
}

router.post('/', authenticated, async (req, res, next) => {
  try {
    const user = req.user;
    if (!user.roles.includes('team_lead')) {
      throw new AppError('Forbidden: insufficient privileges', 403);
    }
    const { teamName } = CreateTeamSchema.parse(req.body);
    const ownerId = user.user_id;
    const newTeam = await createTeam(ownerId, teamName.trim());
    res.status(201).json(newTeam);
  } catch (err) {
    if (err.name === 'ZodError') {
      return next(new AppError(err.errors.map(e => e.message).join(', '), 400));
    }
    next(err);
  }
});

router.get('/lead', authenticated, async (req, res, next) => {
  try {
    const user = req.user;
    if (!user.roles.includes('team_lead')) {
      throw new AppError('Forbidden: insufficient privileges', 403);
    }
    const teams = await getTeamsLedByUser(user.user_id);
    res.json(teams);
  } catch (err) {
    next(err);
  }
});

router.get('/user', authenticated, async (req, res, next) => {
  try {
    const user = req.user;
    const teams = await getTeamsForUser(user.user_id);
    res.json(teams);
  } catch (err) {
    next(err);
  }
});

router.post('/:teamId/users', authenticated, async (req, res, next) => {
  try {
    const user = req.user;
    const teamId = Number(req.params.teamId);
    if (isNaN(teamId)) {
      throw new AppError('Invalid team ID', 400);
    }
    if (!user.roles.includes('team_lead')) {
      throw new AppError('Forbidden: cannot add users to this team', 403);
    }
    const { userId } = AddUserToTeamSchema.parse(req.body);
    const canManage = await isUserTeamLead(user, teamId);
    if (!canManage) {
      throw new AppError('Forbidden: cannot add users to this team', 403);
    }
    await addUserToTeam(userId, teamId);
    res.status(204).send();
  } catch (err) {
    if (err.name === 'ZodError') {
      return next(new AppError(err.errors.map(e => e.message).join(', '), 400));
    }
    next(err);
  }
});

router.delete('/:teamId/users/:userId', authenticated, async (req, res, next) => {
  try {
    const user = req.user;
    const teamId = Number(req.params.teamId);
    const userIdToRemove = Number(req.params.userId);
    if (isNaN(teamId) || isNaN(userIdToRemove)) {
      throw new AppError('Invalid team ID or user ID', 400);
    }
    if (!user.roles.includes('team_lead')) {
      throw new AppError('Forbidden: cannot remove users from this team', 403);
    }
    const canManage = await isUserTeamLead(user, teamId);
    if (!canManage) {
      throw new AppError('Forbidden: cannot remove users from this team', 403);
    }
    await removeUserFromTeam(userIdToRemove, teamId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.get('/:teamId/users', authenticated, async (req, res, next) => {
  try {
    const user = req.user;
    const teamId = Number(req.params.teamId);
    if (isNaN(teamId)) {
      throw new AppError('Invalid team ID', 400);
    }
    const canView = await isUserTeamLead(user, teamId);
    if (!canView) {
      throw new AppError('Forbidden: cannot view members of this team', 403);
    }
    const members = await getUsersInTeam(teamId);
    res.json(members);
  } catch (err) {
    next(err);
  }
});

export default router;
