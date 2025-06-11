import { z } from "zod";
import { apiFetch } from "./http";

/**
 * Get user's profile picture
 * @param {number} userId
 */
export const getUserPicture = async (userId) => {
    const link = await apiFetch(`/users/${userId}/picture`);
    return z.string().parse(link);
};
