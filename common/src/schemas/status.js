import { z } from "zod"; 

// Schema for a complete Status object (e.g., as returned from the database)
export const StatusSchema = z.object({
  statusId: z.number().int().positive(),
  statusName: z.string().min(1).max(32),
});

/**
 * @typedef {z.infer<typeof StatusSchema>} Status
 */

// Schema for creating a new status (ID is not provided by the client)
export const CreateStatusSchema = z.object({
  statusName: z.string().min(1).max(32),
});

/**
 * @typedef {z.infer<typeof CreateStatusSchema>} CreateStatusInput
 */

// Schema for updating an existing status (all fields are optional, but at least one must be present)
export const UpdateStatusSchema = z.object({
  statusName: z.string().min(1).max(32)
});


/**
 * @typedef {z.infer<typeof UpdateStatusSchema>} UpdateStatusInput
 */

// Schema for validating an ID, typically from URL parameters
export const StatusIdSchema = z.number().int().positive();
/**
 * @typedef {z.infer<typeof StatusIdSchema>} StatusId
 */