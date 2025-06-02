import { z } from 'zod/v4';

export const CreateTaskSchema = z.object({
  teamId: z
    .number({ invalid_type_error: 'teamId must be a number' })
    .int()
    .positive({ message: 'teamId must be a positive integer' }),
  assignedToId: z
    .number({ invalid_type_error: 'assignedToId must be a number' })
    .int()
    .positive({ message: 'assignedToId must be a positive integer' })
    .optional(),
  statusId: z
    .number({ invalid_type_error: 'statusId must be a number' })
    .int()
    .positive({ message: 'statusId must be a positive integer' }),
  name: z
    .string({ invalid_type_error: 'name must be a string' })
    .min(1, { message: 'name cannot be empty' })
    .max(32, { message: 'name must be at most 32 characters' }),
  content: z
    .string({ invalid_type_error: 'content must be a string' })
    .max(255, { message: 'content must be at most 255 characters' })
    .optional(),
});

export const UpdateTaskDetailsSchema = z.object({
  name: z
    .string({ invalid_type_error: 'name must be a string' })
    .min(1, { message: 'name cannot be empty' })
    .max(32, { message: 'name must be at most 32 characters' }),
  content: z
    .string({ invalid_type_error: 'content must be a string' })
    .max(255, { message: 'content must be at most 255 characters' })
    .optional(),
});

export const UpdateStatusSchema = z.object({
  statusId: z
    .number({ invalid_type_error: 'statusId must be a number' })
    .int()
    .positive({ message: 'statusId must be a positive integer' }),
});

export const AssignTaskSchema = z.object({
  userId: z
    .number({ invalid_type_error: 'userId must be a number' })
    .int()
    .positive({ message: 'userId must be a positive integer' }),
});
