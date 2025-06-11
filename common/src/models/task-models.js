import { z } from 'zod/v4';

export const CreateTaskSchema = z.object({
  teamId: z.int({ error: 'Team ID must be an integer.' }),
  assignedToId: z.int({ error: 'Assigned user ID must be an integer.' }).nullable(),
  statusId: z.int({ error: 'Status ID must be an integer.' }),
  name: z.string({ error: 'Task name must be a string.' }).nonempty()
    .min(1, { error: 'Task name cannot be empty.' })
    .max(32, { error: 'Task name must be at most 32 characters.' }),
  content: z
    .string({ error: 'Content must be a string.' })
    .max(255, { error: 'Content must be at most 255 characters.' }),
});

/**
 * @typedef {z.infer<typeof CreateTaskSchema>} CreateTaskRequest
 */

export const UpdateTaskDetailsSchema = z.object({
  name: z
    .string({ error: 'Task name must be a string.' })
    .min(1, { error: 'Task name cannot be empty.' })
    .max(32, { error: 'Task name must be at most 32 characters.' }),
  content: z
    .string({ error: 'Content must be a string.' })
    .max(255, { error: 'Content must be at most 255 characters.' }),
});

/**
 * @typedef {z.infer<typeof UpdateTaskDetailsSchema>} UpdateTaskDetailsRequest
 */

export const UpdateStatusSchema = z.object({
  statusId: z.int({ error: 'Status ID must be an integer.' }),
});

/**
 * @typedef {z.infer<typeof UpdateStatusSchema>} UpdateStatusRequest
 */

export const AssignTaskSchema = z.object({
  userId: z
    .int({ error: 'User ID must be a number.' })
    .nullable(),
});

/**
 * @typedef {z.infer<typeof AssignTaskSchema>} AssignTaskRequest
 */

export const TaskSchema = z.object({
  taskId: z.int(),
  taskName: z.string(),
  taskContent: z.string(),
  statusId: z.int(),
  assignedToId: z.int().nullable(),
  teamId: z.int(),
});

/**
 * @typedef {z.infer<typeof TaskSchema>} Task
 */

export const StatusSchema = z.object({
  statusId: z.int(),
  statusName: z.string(),
});

/**
 * @typedef {z.infer<typeof StatusSchema>} Status
 */

export const HistorySchema = z.object({
  historyId: z.int(),
  taskId: z.int(),
  statusId: z.int(),
  assignedToId: z.int().nullable(),
  timestamp: z.coerce.date(),
});

/**
 * @typedef {z.infer<typeof HistorySchema>} History
 */

export const PaginationInfoSchema = z.object({
  currentPage: z.int(),
  totalPages: z.int(),
  totalItems: z.int(),
  itemsPerPage: z.int(),
});

/**
 * @typedef {z.infer<typeof PaginationInfoSchema>} PaginationInfo
 */

export const StatusSummarySchema = z.object({
  statusId: z.int(),
  statusName: z.string(),
  taskCount: z.int(),
});

/**
 * @typedef {z.infer<typeof StatusSummarySchema>} StatusSummary
 */

export const TeamMemberTaskSummarySchema = z.object({
  userId: z.int(),
  memberName: z.string(),
  statusId: z.int(),
  statusName: z.string(),
  taskCount: z.int(),
  avgDaysHeld: z.number(),
});

/**
 * @typedef {z.infer<typeof TeamMemberTaskSummarySchema>} TeamMemberTaskSummary
 */
