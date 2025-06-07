import { z } from 'zod/v4';

export const CreateTaskSchema = z.object({
  teamId: z
    .number({ error: 'teamId must be a number' })
    .int()
    .positive({ message: 'teamId must be a positive integer' }),
  assignedToId: z
    .number({ error: 'assignedToId must be a number' })
    .int()
    .positive({ message: 'assignedToId must be a positive integer' })
    .optional(),
  statusId: z
    .number({ error: 'statusId must be a number' })
    .int()
    .positive({ message: 'statusId must be a positive integer' }),
  name: z
    .string({ error: 'name must be a string' })
    .min(1, { message: 'name cannot be empty' })
    .max(32, { message: 'name must be at most 32 characters' }),
  content: z
    .string({ error: 'content must be a string' })
    .max(255, { message: 'content must be at most 255 characters' })
    .optional(),
});

export const UpdateTaskDetailsSchema = z.object({
  name: z
    .string({ error: 'name must be a string' })
    .min(1, { message: 'name cannot be empty' })
    .max(32, { message: 'name must be at most 32 characters' }),
  content: z
    .string({ error: 'content must be a string' })
    .max(255, { message: 'content must be at most 255 characters' })
    .optional(),
});

export const UpdateStatusSchema = z.object({
  statusId: z
    .number({ error: 'statusId must be a number' })
    .int()
    .positive({ message: 'statusId must be a positive integer' }),
});

export const AssignTaskSchema = z.object({
  userId: z
    .number({ error: 'userId must be a number' })
    .int()
    .positive({ message: 'userId must be a positive integer' })
    .nullable(),
});

export const TaskSchema = z.object({
  task_id: z.number(),
  task_name: z.string(),
  task_content: z.string().nullable(),
  status_id: z.number(),
  status_name: z.string(),
  assigned_to_id: z.number().nullable(),
  team_id: z.number(),
});

export const TaskWithAssigneeSchema = z.object({
  task_id: z.number(),
  task_name: z.string(),
  task_content: z.string().nullable(),
  status_id: z.number(),
  status_name: z.string(),
  assigned_to_email: z.string().nullable(),
});

/**
 * @typedef {z.infer<typeof CreateTaskSchema>} CreateTaskRequest
 */

/**
 * @typedef {z.infer<typeof UpdateTaskDetailsSchema>} UpdateTaskDetailsRequest
 */

/**
 * @typedef {z.infer<typeof UpdateStatusSchema>} UpdateStatusRequest
 */

/**
 * @typedef {z.infer<typeof AssignTaskSchema>} AssignTaskRequest
 */

/**
 * @typedef {z.infer<typeof TaskSchema>} Task
 */

/**
 * @typedef {z.infer<typeof TaskWithAssigneeSchema>} TaskWithAssignee
 */