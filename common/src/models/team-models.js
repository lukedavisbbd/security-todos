import { z } from 'zod/v4';
import { StatusSummarySchema, TeamMemberTaskSummarySchema } from './task-models.js';

export const CreateTeamSchema = z.object({
  teamName: z
    .string({ error: 'Team name must be a string.' })
    .min(1, { message: 'Team name cannot be empty.' })
    .max(32, { message: 'Team name must be at most 32 characters.' }),
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
export const TeamWithStatsSchema = TeamSchema.and(z.object({
  memberCount: z.int(),
  taskCount: z.int(),
}));

/**
 * @typedef {z.infer<typeof TeamWithStatsSchema>} TeamWithStats
 */

export const TeamOverviewStatsSchema = z.object({
  teamId: z.int(),
  teamName: z.string(),
  teamOwnerId: z.int(),
  ownerName: z.string(),
  totalMembers: z.int(),
  totalTasks: z.int(),
  completedTasks: z.int(),
  activeTasks: z.int(),
  unassignedTasks: z.int(),
  completionPercentage: z.number(),
});

/**
 * @typedef {z.infer<typeof TeamOverviewStatsSchema>} TeamOverviewStats
 */

export const TeamMemberOverallStatsSchema = z.object({
  userId: z.int(),
  memberName: z.string(),
  totalTasks: z.int(),
  completedTasks: z.int(),
  activeTasks: z.int(),
  avgDaysPerTask: z.number(),
});

/**
 * @typedef {z.infer<typeof TeamMemberOverallStatsSchema>} TeamMemberOverallStats
 */

export const TeamRecentActivitySchema = z.object({
  taskId: z.int(),
  taskName: z.string(),
  statusName: z.string(),
  memberName: z.string().nullable(),
  timestamp: z.coerce.date(),
  daysAgo: z.number(),
});

/**
 * @typedef {z.infer<typeof TeamRecentActivitySchema>} TeamRecentActivity
 */

export const TeamReportsSchema = z.object({
  overview: TeamOverviewStatsSchema,
  statusSummary: StatusSummarySchema.array(),
  memberSummary: TeamMemberTaskSummarySchema.array(),
  memberStats: TeamMemberOverallStatsSchema.array(),
  recentActivity: TeamRecentActivitySchema.array(),
});

/**
 * @typedef {z.infer<typeof TeamReportsSchema>} TeamReports
 */
