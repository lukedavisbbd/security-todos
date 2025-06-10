import { apiFetch } from "./http";

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
  return await apiFetch(
    '/users/profile/change-password',
    'PUT',
    payload
  );
}
