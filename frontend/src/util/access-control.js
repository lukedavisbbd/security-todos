import { apiFetch } from "./http";

/**
 * @param {string} search
 */
export const searchUsers = async (search) => {
    /**
     * @type {import("common").UserWithRoles[]}
     */
    const result = await apiFetch(`/users?search=${encodeURIComponent(search)}`);
    return result;
};

export const fetchRoles = async () => {
    /**
     * @type {string[]}
     */
    const result = await apiFetch(`/roles`);
    return result;
};

/**
 * @param {number} userId
 * @param {string} role
 */
export const addRole = async (userId, role) => {
    /**
     * @type {string[]}
     */
    const result = await apiFetch(`/users/${userId}/roles`, 'POST', {
        role,
    });
    return result;
};

/**
 * @param {number} userId
 * @param {string} role
 */
export const deleteRole = async (userId, role) => {
    /**
     * @type {string[]}
     */
    const result = await apiFetch(`/users/${userId}/roles`, 'DELETE', {
        role,
    });
    return result;
};
