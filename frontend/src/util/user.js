import { z } from "zod";
import { apiFetch } from "./http";

/**
 * Update user's name
 * @param {string} name
 */
export const updateUserName = async (name) => {
    await apiFetch('/users/profile/name', 'PUT', { name });
};

/**
 * Get user's profile picture
 * @param {number} userId
 */
export const getUserPicture = async (userId) => {
    const link = await apiFetch(`/users/${userId}/picture`);
    return z.string().parse(link);
};
