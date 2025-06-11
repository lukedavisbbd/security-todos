import { Router } from 'express';
import { AppError, CreateTeamSchema, AddUserToTeamSchema } from 'common';
import {
  createTeam, getTeamsWithStats, getTeamsForUser, addUserToTeam,
  removeUserFromTeam, getUsersInTeam, getTeamById, isTeamOwner,
  promoteToTeamLead,
  deleteTeam
} from '../db/team-queries.js';
import { authenticated } from '../middleware/auth-middleware.js';
import { validate } from '../utils/validation.js';
import z from 'zod/v4';
import { getTeamReports } from '../db/report-queries.js';

/**
 * @param {number} teamId
 * @param {number} userId
 */
export async function assertTeamAccess(teamId, userId) {
  /**
   * @param {number} teamId
   * @param {number} userId
   */
  const userTeams = await getTeamsForUser(userId);
  const hasAccess = userTeams.some(t => t.teamId === teamId);

  if (!hasAccess) {
    throw new AppError({
      code: 'missing_role',
      status: 401,
      message: 'Not authorised to access team.',
      data: undefined,
    });
  }
}

/**
 * @param {number} teamId
 * @param {number} userId
 */
export async function assertTeamOwner(teamId, userId) {
  const isOwner = await isTeamOwner(teamId, userId);
  if (!isOwner) {
    throw new AppError({
      code: 'missing_role',
      status: 401,
      message: 'Not authorised to access team.',
      data: undefined,
    });
  }
}

const router = Router();

/**
 * Create a new team
 */
router.post('/teams', authenticated, async (req, res) => {
  const { teamName } = validate(CreateTeamSchema, req.body);
  
  // assert that authentication middleware has included jwtContents
  const authenticatedReq = /** @type {import('../index.js').AuthenticatedRequest} */(req);
  const ownerId = authenticatedReq.jwtContents.user.userId;
  
  const newTeam = await createTeam(ownerId, teamName.trim());
  res.status(201).json(newTeam);
});

/**
 * Get teams overview with stats for current user
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
 */
router.post('/teams/:teamId/users', authenticated, async (req, res) => {
  const teamId = validate(z.coerce.number().int(), req.params.teamId);
  // assert that authentication middleware has included jwtContents
  const authenticatedReq = /** @type {import('../index.js').AuthenticatedRequest} */(req);
  const currentUserId = authenticatedReq.jwtContents.user.userId;
  
  const { userId } = validate(AddUserToTeamSchema, req.body);

  await assertTeamOwner(teamId, currentUserId);

  await addUserToTeam(userId, teamId);
  res.status(204).send();
});

/**
 * Remove user from team (only team owner can do this)
 */
router.delete('/teams/:teamId/users/:userId', authenticated, async (req, res) => {
  const teamId = validate(z.coerce.number().int(), req.params.teamId);
  const userIdToRemove = validate(z.coerce.number().int(), req.params.userId);
  // assert that authentication middleware has included jwtContents
  const authenticatedReq = /** @type {import('../index.js').AuthenticatedRequest} */(req);
  const currentUserId = authenticatedReq.jwtContents.user.userId;

  await assertTeamOwner(teamId, currentUserId);

  await removeUserFromTeam(userIdToRemove, teamId);
  res.status(204).send();
});

/**
 * Get team members
 */
router.get('/teams/:teamId/users', authenticated, async (req, res) => {
  const teamId = validate(z.coerce.number().int(), req.params.teamId);
  // assert that authentication middleware has included jwtContents
  const authenticatedReq = /** @type {import('../index.js').AuthenticatedRequest} */(req);
  const currentUserId = authenticatedReq.jwtContents.user.userId;

  await assertTeamAccess(teamId, currentUserId);

  const members = await getUsersInTeam(teamId);
  res.json(members);
});

router.get('/teams/:teamId', authenticated, async (req, res) => {
  const teamId = validate(z.coerce.number().int(), req.params.teamId);
  // assert that authentication middleware has included jwtContents
  const authenticatedReq = /** @type {import('../index.js').AuthenticatedRequest} */(req);
  const currentUserId = authenticatedReq.jwtContents.user.userId;

  await assertTeamAccess(teamId, currentUserId);
  
  const team = await getTeamById(teamId);
  if (!team) {
    throw new AppError({
      code: 'not_found',
      status: 404,
      message: 'Team not found',
      data: undefined,
    });
  }

  res.json(team);
});

/**
 * Get report for team
 */
router.get('/teams/:teamId/reports', authenticated, async (req, res) => {
  const teamId = validate(z.coerce.number().int(), req.params.teamId);
  // assert that authentication middleware has included jwtContents
  const authenticatedReq = /** @type {import('../index.js').AuthenticatedRequest} */(req);
  const currentUserId = authenticatedReq.jwtContents.user.userId;

  await assertTeamAccess(teamId, currentUserId);

  const report = await getTeamReports(teamId);

  res.json(report)
})

/*
 * Promote team member to team lead (only current team owner can do this)
 */
router.put('/teams/:teamId/promote/:userId', authenticated, async (req, res) => {
  const teamId = validate(z.coerce.number().int(), req.params.teamId);
  const newOwnerId = validate(z.coerce.number().int(), req.params.userId);
  // assert that authentication middleware has included jwtContents
  const authenticatedReq = /** @type {import('../index.js').AuthenticatedRequest} */(req);
  const currentUserId = authenticatedReq.jwtContents.user.userId;

  await isTeamOwner(teamId, currentUserId);

  await promoteToTeamLead(teamId, newOwnerId);

  res.status(204).send();
});

/**
 * Delete team (only team owner can do this)
 */
router.delete('/teams/:teamId', authenticated, async (req, res) => {
  const teamId = validate(z.coerce.number().int(), req.params.teamId);
  // assert that authentication middleware has included jwtContents
  const authenticatedReq = /** @type {import('../index.js').AuthenticatedRequest} */(req);
  const currentUserId = authenticatedReq.jwtContents.user.userId;

  await assertTeamOwner(teamId, currentUserId);

  const deleted = await deleteTeam(teamId);
  if (deleted) {
    res.status(204).send();
  } else {
    throw new AppError({
      code: 'not_found',
      status: 404,
      message: 'Team not found or you are not the owner',
      data: undefined,
    });
  }
});

export default router;