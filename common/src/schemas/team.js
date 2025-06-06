import { z } from "zod/v4";

// Schema for a complete Team object (e.g., as returned from the database)
export const TeamSchema = z.object({
  teamId: z.number().int().positive(),
  teamOwnerId: z.number().int().positive(),
  teamName: z.string().min(1).max(64),
});

/**
 * @typedef {z.infer<typeof TeamSchema>} Team
 */

// Schema for creating a new team (ID is not provided by the client)
export const CreateTeamSchema = z.object({
  teamOwnerId: z.number().int().positive(),
  teamName: z
    .string()
    .min(1, { message: "Team name is required" })
    .max(64, { message: "Team name must be 64 characters or less" }),
});

/**
 * @typedef {z.infer<typeof CreateTeamSchema>} CreateTeamInput
 */

// Schema for updating an existing team
export const UpdateTeamSchema = z.object({
  teamName: z
    .string()
    .min(1, { message: "Team name is required" })
    .max(64, { message: "Team name must be 64 characters or less" }),
});

/**
 * @typedef {z.infer<typeof UpdateTeamSchema>} UpdateTeamInput
 */

// Schema for validating an ID, typically from URL parameters
export const TeamIdSchema = z
  .number()
  .int()
  .positive({ message: "Team ID must be a positive integer" });

/**
 * @typedef {z.infer<typeof TeamIdSchema>} TeamId
 */
