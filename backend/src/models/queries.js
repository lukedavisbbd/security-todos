import { z } from "zod/v4";

export const UserSearchQuerySchema = z.object({
    search: z.string().optional(),
});

/**
 * @typedef {z.infer<typeof UserSearchQuerySchema>} UserSearchQuery
 */
