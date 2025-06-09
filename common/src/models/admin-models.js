import { z } from 'zod/v4';

export const RoleSchema = z.object({
  roleName: z
    .string({ error: 'Role name must be a string.' })
    .min(1, { message: 'Role name cannot be empty.' })
    .max(32, { message: 'Role name must be at most 32 characters.' }),
});

export const AddRoleRequestSchema = z.object({
    role: z.string().nonempty(),
});

/**
 * @typedef {z.infer<typeof AddRoleRequestSchema>} AddRoleRequest
 */
