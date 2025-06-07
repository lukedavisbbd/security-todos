import { z } from 'zod/v4';

export const CreateTeamSchema = z.object({
  teamName: z
    .string({ error: 'teamName must be a string' })
    .min(1, { message: 'teamName cannot be empty' })
    .max(64, { message: 'teamName must be at most 64 characters' }),
});

export const AddUserToTeamSchema = z.object({
  userId: z
    .number({ error: 'userId must be a number' })
    .int()
    .positive({ message: 'userId must be a positive integer' }),
});

// Base Team type
export const TeamSchema = z.object({
  team_id: z.number(),
  team_name: z.string(),
  team_owner_id: z.number(),
});

// Team with statistics type
export const TeamWithStatsSchema = z.object({
  team_id: z.number(),
  team_name: z.string(),
  team_owner_id: z.number(),
  is_owner: z.boolean(),
  member_count: z.number(),
  task_count: z.number(),
});

// Team member type
export const TeamMemberSchema = z.object({
  user_id: z.number(),
  email: z.string(),
  name: z.string(),
});

/**
 * @typedef {z.infer<typeof CreateTeamSchema>} CreateTeamRequest
 */

/**
 * @typedef {z.infer<typeof AddUserToTeamSchema>} AddUserToTeamRequest
 */

/**
 * @typedef {z.infer<typeof TeamSchema>} Team
 */

/**
 * @typedef {z.infer<typeof TeamWithStatsSchema>} TeamWithStats
 */

/**
 * @typedef {z.infer<typeof TeamMemberSchema>} TeamMember
 */