import { z } from 'zod/v4';

export const RoleSchema = z.object({
  roleName: z
    .string({ error: 'roleName must be a string' })
    .min(1, { message: 'roleName cannot be empty' })
    .max(32, { message: 'roleName must be at most 32 characters' }),
});
