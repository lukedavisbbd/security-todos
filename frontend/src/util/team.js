import { apiFetch } from "./http";

/**
 * Get teams overview with stats for current user
 * @returns {Promise<import('common').TeamWithStats[]>}
 */
export const getTeamsOverview = async () => {
    return await apiFetch('/teams/overview');
};

/**
 * Create a new team
 * @param {string} teamName
 * @returns {Promise<import('common').Team>}
 */
export const createTeam = async (teamName) => {
    return await apiFetch('/teams', 'POST', {
        teamName,
    });
};

/**
 * Get teams user is a member of
 * @returns {Promise<import('common').Team[]>}
 */
export const getTeamMemberships = async () => {
    return await apiFetch('/teams/member');
};

/**
 * Get team members
 * @param {number} teamId
 * @returns {Promise<import('common').TeamMember[]>}
 */
export const getTeamMembers = async (teamId) => {
    return await apiFetch(`/teams/${teamId}/users`);
};

/**
 * Add user to team
 * @param {number} teamId
 * @param {number} userId
 * @returns {Promise<{}>}
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
 * @returns {Promise<{}>}
 */
export const removeUserFromTeam = async (teamId, userId) => {
    return await apiFetch(`/teams/${teamId}/users/${userId}`, 'DELETE');
};

/**
 * Get specific team details
 * @param {number} teamId
 * @returns {Promise<import('common').Team>}
 */
export const getTeamById = async (teamId) => {
    return await apiFetch(`/teams/${teamId}`);
};