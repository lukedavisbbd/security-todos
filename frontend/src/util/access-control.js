import { UserWithRolesSchema } from "common";
import { apiFetch } from "./http";
import { z } from "zod/v4";

/**
 * @param {string} search
 */
export const searchUsers = async (search) => {
    const users = await apiFetch(`/users?search=${encodeURIComponent(search)}`);
    return UserWithRolesSchema.array().parse(users);
};

export const fetchRoles = async () => {
    const roles = await apiFetch(`/roles`);
    return z.string().array().parse(roles);
};

/**
 * @param {number} userId
 * @param {string} role
 */
export const addRole = async (userId, role) => {
    const newRoles = await apiFetch(`/users/${userId}/roles`, 'POST', {
        role,
    });
    return z.string().array().parse(newRoles);
};

/**
 * @param {number} userId
 * @param {string} role
 */
export const deleteRole = async (userId, role) => {
    const newRoles = await apiFetch(`/users/${userId}/roles`, 'DELETE', {
        role,
    });
    return z.string().array().parse(newRoles);
};

/**
 * @param {number} userId
 */
export const logoutUser = async (userId) => {
    await apiFetch(`/auth/logout/${userId}`);
};
