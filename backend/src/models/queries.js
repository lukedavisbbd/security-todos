import { z } from "zod/v4";

export const UserSearchQuerySchema = z.object({
    search: z.string().optional(),
});

/**
 * @typedef {z.infer<typeof UserSearchQuerySchema>} UserSearchQuery
 */

export const TaskSearchQuerySchema = z.object({
    userId: z.coerce.number().int().nullable().optional(),
    statusId: z.coerce.number().int().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().lte(100).optional(),
});

/**
 * @typedef {z.infer<typeof TaskSearchQuerySchema>} TaskSearchQuery
 */

export const LogoutQuerySchema = z.object({
    userId: z.coerce.number().int().optional(),
    all: z.coerce.boolean(),
});

/**
 * @typedef {z.infer<typeof LogoutQuerySchema>} LogoutQuery
 */
