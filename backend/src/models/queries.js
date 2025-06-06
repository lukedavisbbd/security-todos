import { z } from "zod/v4";

export const UserSearchQuerySchema = z.object({
    search: z.string().optional(),
});

/**
 * @typedef {z.infer<typeof UserSearchQuerySchema>} UserSearchQuery
 */

export const RoleRequestSchema = z.object({
    role: z.string().nonempty(),
});

/**
 * @typedef {z.infer<typeof RoleRequestSchema>} AddRoleRequest
 */
