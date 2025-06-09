import { z } from 'zod/v4';

export const CreateTeamSchema = z.object({
  teamName: z
    .string({ error: 'Team name must be a string.' })
    .min(1, { message: 'Team name cannot be empty.' })
    .max(64, { message: 'Team name must be at most 64 characters.' }),
});

/**
 * @typedef {z.infer<typeof CreateTeamSchema>} CreateTeamRequest
 */

export const AddUserToTeamSchema = z.object({
  userId: z.int({ error: 'User ID must be an integer.' }),
});

/**
 * @typedef {z.infer<typeof AddUserToTeamSchema>} AddUserToTeamRequest
 */

// Base Team type
export const TeamSchema = z.object({
  teamId: z.int(),
  teamName: z.string(),
  teamOwnerId: z.int(),
});

/**
 * @typedef {z.infer<typeof TeamSchema>} Team
 */

// Team with statistics type
export const TeamWithStatsSchema = z.object({
  teamId: z.int(),
  teamName: z.string(),
  teamOwnerId: z.int(),
  memberCount: z.int(),
  taskCount: z.int(),
});

/**
 * @typedef {z.infer<typeof TeamWithStatsSchema>} TeamWithStats
 */
