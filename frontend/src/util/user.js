import { apiFetch } from "./http";
import { z } from "zod/v4";

/**
 * Update user's name
 * @param {string} name
 */
export const updateUserName = async (name) => {
    await apiFetch('/users/profile/name', 'PUT', { name });
};

/**
 * @param {{ oldPassword: string; newPassword: string; twoFactor: string }} payload
 */
export const changePassword = async (payload) => {
  await apiFetch(
    '/users/profile/change-password',
    'PUT',
    payload
  );
};
