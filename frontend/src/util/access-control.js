import { apiFetch } from "./http";

/**
 * @param {string} search
 */
export const searchUsers = async (search) => {
    /**
     * @type {import("./http").ApiResult<import("common").UserWithRoles[]> | null}
     */
    const result = await apiFetch(`/users?search=${encodeURIComponent(search)}`);

    if (!result)
        return null;

    return result;
};

export const fetchRoles = async () => {
    /**
     * @type {import("./http").ApiResult<string[]> | null}
     */
    const result = await apiFetch(`/roles`);

    if (!result)
        return null;

    return result;
};

/**
 * @param {number} userId
 * @param {string} role
 */
export const addRole = async (userId, role) => {
    /**
     * @type {import("./http").ApiResult<string[]> | null}
     */
    const result = await apiFetch(`/users/${userId}/roles`, 'POST', {
        role,
    });

    if (!result)
        return null;

    return result;
};

/**
 * @param {number} userId
 * @param {string} role
 */
export const deleteRole = async (userId, role) => {
    /**
     * @type {import("./http").ApiResult<string[]> | null}
     */
    const result = await apiFetch(`/users/${userId}/roles`, 'DELETE', {
        role,
    });

    if (!result)
        return null;

    return result;
};
