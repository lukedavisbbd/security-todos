import { PublicUserSchema, UserWithRolesSchema } from "common";
import { apiFetch } from "./http";
import { z } from "zod/v4";

/**
 * @param {string} search
 */
export const searchUsers = async (search) => {
    const users = await apiFetch(`/users?search=${encodeURIComponent(search)}`);
    return PublicUserSchema.array().parse(users);
};

/**
 * @param {string} search
 */
export const searchUsersFull = async (search) => {
    const users = await apiFetch(`/users/full?search=${encodeURIComponent(search)}`);
    return UserWithRolesSchema.array().parse(users);
};

/** @param {number} delayMs */
export const timeoutPromise = (delayMs) => {
    return new Promise(resolve => setTimeout(resolve, delayMs));
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

/**
 * @param {number} userId
 */
export const getResetToken = async (userId) => {
    const token = await apiFetch(`/auth/password/reset/${userId}`);
    return z.string().parse(token);
};
