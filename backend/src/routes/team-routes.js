import { Router } from 'express';
import { AppError, CreateTeamSchema, AddUserToTeamSchema } from 'common';

import {
  createTeam,
  getTeamsWithStats,
  getTeamsForUser,
  addUserToTeam,
  removeUserFromTeam,
  getUsersInTeam,
  getTeamById,
  isTeamOwner
} from '../db/team-queries.js';

import { authenticated } from '../middleware/auth-middleware.js';

const router = Router();

/**
 * Create a new team
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.post('/teams', authenticated, async (req, res) => {
  const { teamName } = CreateTeamSchema.parse(req.body);
  
  // assert that authentication middleware has included jwtContents
  const authenticatedReq = /** @type {import('../index.js').AuthenticatedRequest} */(req);
  const ownerId = authenticatedReq.jwtContents.user.userId;
  
  const newTeam = await createTeam(ownerId, teamName.trim());
  res.status(201).json(newTeam);
});

/**
 * Get teams overview with stats for current user
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.get('/teams/overview', authenticated, async (req, res) => {
  // assert that authentication middleware has included jwtContents
  const authenticatedReq = /** @type {import('../index.js').AuthenticatedRequest} */(req);
  const userId = authenticatedReq.jwtContents.user.userId;
  const teams = await getTeamsWithStats(userId);
  res.json(teams);
});

/**
 * Get teams user is a member of
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.get('/teams/member', authenticated, async (req, res) => {
  // assert that authentication middleware has included jwtContents
  const authenticatedReq = /** @type {import('../index.js').AuthenticatedRequest} */(req);
  const userId = authenticatedReq.jwtContents.user.userId;
  const teams = await getTeamsForUser(userId);
  res.json(teams);
});

/**
 * Add user to team (only team owner can do this)
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.post('/teams/:teamId/users', authenticated, async (req, res) => {
  const teamId = Number(req.params.teamId);
  // assert that authentication middleware has included jwtContents
  const authenticatedReq = /** @type {import('../index.js').AuthenticatedRequest} */(req);
  const currentUserId = authenticatedReq.jwtContents.user.userId;
  
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

  // Check if current user is team owner
  const isOwner = await isTeamOwner(teamId, currentUserId);
  if (!isOwner) {
    throw new AppError({
      code: 'missing_role',
      status: 403,
      message: 'Only team owners can add members',
      data: undefined,
    });
  }

  const { userId } = AddUserToTeamSchema.parse(req.body);
  await addUserToTeam(userId, teamId);
  res.status(204).send();
});

/**
 * Remove user from team (only team owner can do this)
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.delete('/teams/:teamId/users/:userId', authenticated, async (req, res) => {
  const teamId = Number(req.params.teamId);
  const userIdToRemove = Number(req.params.userId);
  // @ts-ignore - jwtContents is added by authenticated middleware
  const currentUserId = req.jwtContents.user.userId;
  
  if (isNaN(teamId) || isNaN(userIdToRemove)) {
    throw new AppError({
      code: 'validation_error',
      status: 400,
      message: 'Validation Error',
      data: {
          errors: ['Invalid team ID or user ID']
      },
    });
  }

  // Check if current user is team owner
  const isOwner = await isTeamOwner(teamId, currentUserId);
  if (!isOwner) {
    throw new AppError({
      code: 'missing_role',
      status: 403,
      message: 'Only team owners can remove members',
      data: undefined,
    });
  }

  await removeUserFromTeam(userIdToRemove, teamId);
  res.status(204).send();
});

/**
 * Get team members
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.get('/teams/:teamId/users', authenticated, async (req, res) => {
  const teamId = Number(req.params.teamId);
  // assert that authentication middleware has included jwtContents
  const authenticatedReq = /** @type {import('../index.js').AuthenticatedRequest} */(req);
  const currentUserId = authenticatedReq.jwtContents.user.userId;
  
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

  // Check if current user is team member or owner
  const team = await getTeamById(teamId);
  if (!team) {
    throw new AppError({
      code: 'not_found',
      status: 404,
      message: 'Team not found',
      data: undefined,
    });
  }

  const userTeams = await getTeamsForUser(currentUserId);
  const isMember = userTeams.some(t => t.team_id === teamId) || team.team_owner_id === currentUserId;
  
  if (!isMember) {
    throw new AppError({
      code: 'missing_role',
      status: 403,
      message: 'Not authorized to view team members',
      data: undefined,
    });
  }

  const members = await getUsersInTeam(teamId);
  res.json(members);
});

/**
 * Get specific team details
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.get('/teams/:teamId', authenticated, async (req, res) => {
  const teamId = Number(req.params.teamId);
  // assert that authentication middleware has included jwtContents
  const authenticatedReq = /** @type {import('../index.js').AuthenticatedRequest} */(req);
  const currentUserId = authenticatedReq.jwtContents.user.userId;
  
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

  const team = await getTeamById(teamId);
  if (!team) {
    throw new AppError({
      code: 'not_found',
      status: 404,
      message: 'Team not found',
      data: undefined,
    });
  }

  // Check if current user is team member or owner
  const userTeams = await getTeamsForUser(currentUserId);
  const isMember = userTeams.some(t => t.team_id === teamId) || team.team_owner_id === currentUserId;
  
  if (!isMember) {
    throw new AppError({
      code: 'missing_role',
      status: 403,
      message: 'Not authorized to view this team',
      data: undefined,
    });
  }

  res.json(team);
});

export default router;