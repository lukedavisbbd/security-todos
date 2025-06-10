import { apiFetch } from "./http";

/**
 * Update user's name
 * @param {string} name
 */
export const updateUserName = async (name) => {
    await apiFetch('/users/profile/name', 'PUT', { name });
};