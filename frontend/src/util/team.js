import { apiFetch } from "./http";

/**
 * Get teams overview with stats for current user
 * @param {Object} [options] - Pagination options
 * @param {number} [options.page=1] - Page number (1-based)
 * @param {number} [options.limit=10] - Items per page
 * @returns {Promise<import("./http").ApiResult<{teams: import('common').TeamWithStats[], pagination: {currentPage: number, totalPages: number, totalItems: number, itemsPerPage: number}}> | null>}
 */
export const getTeamsOverview = async (options = {}) => {
    const searchParams = new URLSearchParams();
    
    if (options.page !== undefined) {
        searchParams.append('page', options.page.toString());
    }
    
    if (options.limit !== undefined) {
        searchParams.append('limit', options.limit.toString());
    }
    
    const queryString = searchParams.toString();
    const url = `/teams/overview${queryString ? `?${queryString}` : ''}`;
    
    return await apiFetch(url);
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

/**
 * Get specific team details
 * @param {number} teamId
 * @returns {Promise<import("./http").ApiResult<import('common').Team> | null>}
 */
export const getTeamById = async (teamId) => {
    return await apiFetch(`/teams/${teamId}`);
};

/**
 * Delete a team
 * @param {number} teamId
 * @returns {Promise<import("./http").ApiResult<void> | null>}
 */
export const deleteTeam = async (teamId) => {
    return await apiFetch(`/teams/${teamId}`, 'DELETE');
};

/**
 * Promote team member to team lead
 * @param {number} teamId
 * @param {number} userId
 * @returns {Promise<import("./http").ApiResult<void> | null>}
 */
export const promoteToTeamLead = async (teamId, userId) => {
    return await apiFetch(`/teams/${teamId}/promote/${userId}`, 'PUT');
};

/**
 * Get team reports and analytics
 * @param {number} teamId
 * @returns {Promise<import("./http").ApiResult<{
 *   overview: any,
 *   statusSummary: Array<{status_id: number, status_name: string, task_count: number}>,
 *   memberSummary: Array<any>,
 *   memberStats: Array<any>,
 *   recentActivity: Array<any>
 * }> | null>}
 */
export const getTeamReports = async (teamId) => {
    return await apiFetch(`/teams/${teamId}/reports`);
};