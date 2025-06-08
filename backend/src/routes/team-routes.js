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
  isTeamOwner,
  deleteTeam,
  promoteToTeamLead
} from '../db/team-queries.js';

import { getTeamReports } from '../db/report-queries.js';

import { authenticated } from '../middleware/auth-middleware.js';

const router = Router();

/**
 * Create a new team
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.post('/', authenticated, async (req, res) => {
  const { teamName } = CreateTeamSchema.parse(req.body);
  // @ts-ignore - jwtContents is added by authenticated middleware
  const ownerId = req.jwtContents.user.userId;
  
  const newTeam = await createTeam(ownerId, teamName.trim());
  res.status(201).json(newTeam);
});

/**
 * Get teams overview with stats for current user
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.get('/overview', authenticated, async (req, res) => {
  // @ts-ignore - jwtContents is added by authenticated middleware
  const userId = req.jwtContents.user.userId;
  
  const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
  const limit = req.query.limit ? Math.min(15, Math.max(1, Number(req.query.limit))) : 10;

  if (req.query.page && (isNaN(page) || page < 1)) {
    throw new AppError({
      code: 'validation_error',
      status: 400,
      message: 'Invalid page parameter',
      data: {
        errors: ['Page must be a positive number']
      },
    });
  }

  if (req.query.limit && (isNaN(limit) || limit < 1 || limit > 50)) {
    throw new AppError({
      code: 'validation_error',
      status: 400,
      message: 'Invalid limit parameter',
      data: {
        errors: ['Limit must be between 1 and 50']
      },
    });
  }

  const result = await getTeamsWithStats(userId, { page, limit });
  res.json(result);
});

/**
 * Get teams user is a member of
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.get('/member', authenticated, async (req, res) => {
  // @ts-ignore - jwtContents is added by authenticated middleware
  const userId = req.jwtContents.user.userId;
  const teams = await getTeamsForUser(userId);
  res.json(teams);
});

/**
 * Add user to team (only team owner can do this)
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.post('/:teamId/users', authenticated, async (req, res) => {
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
  
  try {
    await addUserToTeam(userId, teamId);
    res.status(204).send();
  } catch (error) {
    if (error.code === 'TEAM_CAPACITY_EXCEEDED') {
      throw new AppError({
        code: 'validation_error',
        status: 400,
        message: 'Team has reached maximum capacity',
        data: {
          errors: ['Team has reached the maximum capacity of 10 members']
        },
      });
    }
    throw error;
  }
});

/**
 * Remove user from team (only team owner can do this)
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.delete('/:teamId/users/:userId', authenticated, async (req, res) => {
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

  const isOwner = await isTeamOwner(teamId, currentUserId);
  if (!isOwner) {
    throw new AppError({
      code: 'missing_role',
      status: 403,
      message: 'Only team owners can remove members',
      data: undefined,
    });
  }

  try {
    await removeUserFromTeam(userIdToRemove, teamId);
    res.status(204).send();
  } catch (error) {
    if (error.code === 'CANNOT_REMOVE_OWNER') {
      throw new AppError({
        code: 'validation_error',
        status: 400,
        message: 'Team owner cannot be removed',
        data: {
          errors: ['Team owner cannot be removed from the team']
        },
      });
    } else if (error.code === 'TEAM_NOT_FOUND') {
      throw new AppError({
        code: 'not_found',
        status: 404,
        message: 'Team not found',
        data: undefined,
      });
    }
    throw error;
  }
});

/**
 * Get team members
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.get('/:teamId/users', authenticated, async (req, res) => {
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
 * Get report for team
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.get('/:teamId/reports', authenticated, async (req, res) => {
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
  const report = await getTeamReports(teamId)
  
  const userTeams = await getTeamsForUser(currentUserId);
  const isMember = userTeams.some(t => t.team_id === teamId);
  
  if (!isMember) {
    throw new AppError({
      code: 'missing_role',
      status: 403,
      message: 'Not authorized to view this team',
      data: undefined,
    });
  }
  
  
  res.json(report)
})

/**
 * Get specific team details
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.get('/:teamId', authenticated, async (req, res) => {
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
      message: 'Not authorized to view this team',
      data: undefined,
    });
  }

  res.json(team);
});

/**
 * Delete team (only team owner can do this)
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.delete('/:teamId', authenticated, async (req, res) => {
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

  try {
    await deleteTeam(teamId, currentUserId);
    res.status(204).send();
  } catch (error) {
    if (error.code === 'TEAM_NOT_FOUND_OR_NOT_OWNER') {
      throw new AppError({
        code: 'not_found',
        status: 404,
        message: 'Team not found or you are not the owner',
        data: undefined,
      });
    } else if (error.code === 'DELETE_FAILED') {
      throw new AppError({
        code: 'internal_server_error',
        status: 500,
        message: 'Failed to delete team',
        data: undefined,
      });
    }
    throw error;
  }
});

/**
 * Promote team member to team lead (only current team owner can do this)
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.put('/:teamId/promote/:userId', authenticated, async (req, res) => {
  const teamId = Number(req.params.teamId);
  const newOwnerId = Number(req.params.userId);
  // @ts-ignore - jwtContents is added by authenticated middleware
  const currentUserId = req.jwtContents.user.userId;
  
  if (isNaN(teamId) || isNaN(newOwnerId)) {
    throw new AppError({
      code: 'validation_error',
      status: 400,
      message: 'Validation Error',
      data: {
          errors: ['Invalid team ID or user ID']
      },
    });
  }

  try {
    await promoteToTeamLead(teamId, currentUserId, newOwnerId);
    res.status(204).send();
  } catch (error) {
    if (error.code === 'TEAM_NOT_FOUND_OR_NOT_OWNER') {
      throw new AppError({
        code: 'not_found',
        status: 404,
        message: 'Team not found or you are not the owner',
        data: undefined,
      });
    } else if (error.code === 'USER_NOT_TEAM_MEMBER') {
      throw new AppError({
        code: 'validation_error',
        status: 400,
        message: 'User is not a member of this team',
        data: {
          errors: ['Cannot promote user who is not a team member']
        },
      });
    } else if (error.code === 'UPDATE_FAILED') {
      throw new AppError({
        code: 'internal_server_error',
        status: 500,
        message: 'Failed to update team ownership',
        data: undefined,
      });
    }
    throw error;
  }
});

export default router;