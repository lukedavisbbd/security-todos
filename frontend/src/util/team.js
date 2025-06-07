import { apiFetch } from "./http";

/**
 * Get teams overview with stats for current user
 * @returns {Promise<import("./http").ApiResult<import('common').TeamWithStats[]> | null>}
 */
export const getTeamsOverview = async () => {
    return await apiFetch('/teams/overview');
};

/**
 * Create a new team
 * @param {string} teamName
 * @returns {Promise<import("./http").ApiResult<import('common').Team> | null>}
 */
export const createTeam = async (teamName) => {
    return await apiFetch('/teams', 'POST', {
        teamName,
    });
};

/**
 * Get teams user is a member of
 * @returns {Promise<import("./http").ApiResult<import('common').Team[]> | null>}
 */
export const getTeamMemberships = async () => {
    return await apiFetch('/teams/member');
};

/**
 * Get team members
 * @param {number} teamId
 * @returns {Promise<import("./http").ApiResult<import('common').TeamMember[]> | null>}
 */
export const getTeamMembers = async (teamId) => {
    return await apiFetch(`/teams/${teamId}/users`);
};

/**
 * Add user to team
 * @param {number} teamId
 * @param {number} userId
 * @returns {Promise<import("./http").ApiResult<void> | null>}
 */
export const addUserToTeam = async (teamId, userId) => {
    return await apiFetch(`/teams/${teamId}/users`, 'POST', {
        userId,
    });
};

/**
 * Remove user from team
 * @param {number} teamId
 * @param {number} userId
 * @returns {Promise<import("./http").ApiResult<void> | null>}
 */
export const removeUserFromTeam = async (teamId, userId) => {
    return await apiFetch(`/teams/${teamId}/users/${userId}`, 'DELETE');
};