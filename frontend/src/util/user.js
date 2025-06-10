import { apiFetch } from './http';

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
