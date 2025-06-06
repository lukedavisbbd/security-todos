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
