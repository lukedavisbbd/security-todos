import { PublicUserSchema, TeamReportsSchema, TeamSchema, TeamWithStatsSchema } from "common";
import { apiFetch } from "./http";

/**
 * Get teams overview with stats for current user
 */
export const getTeamsOverview = async () => {
    const overview = await apiFetch('/teams/overview');
    return TeamWithStatsSchema.array().parse(overview);
};

/**
 * Create a new team
 * @param {string} teamName
 */
export const createTeam = async (teamName) => {
    const team = await apiFetch('/teams', 'POST', {
        teamName,
    });
    return TeamSchema.parse(team);
};

/**
 * Get teams user is a member of
 */
export const getTeamMemberships = async () => {
    const teams = await apiFetch('/teams/member');
    return TeamSchema.array().parse(teams);
};

/**
 * Get team members
 * @param {number} teamId
 */
export const getTeamMembers = async (teamId) => {
    const users = await apiFetch(`/teams/${teamId}/users`);
    return PublicUserSchema.array().parse(users);
};

/**
 * Add user to team
 * @param {number} teamId
 * @param {number} userId
 */
export const addUserToTeam = async (teamId, userId) => {
    await apiFetch(`/teams/${teamId}/users`, 'POST', {
        userId,
    });
};

/**
 * Remove user from team
 * @param {number} teamId
 * @param {number} userId
 */
export const removeUserFromTeam = async (teamId, userId) => {
    await apiFetch(`/teams/${teamId}/users/${userId}`, 'DELETE');
};

/**
 * Get specific team details
 * @param {number} teamId
 */
export const getTeamById = async (teamId) => {
    const team = await apiFetch(`/teams/${teamId}`);
    return TeamWithStatsSchema.nullable().parse(team);
};

/**
 * Delete a team
 * @param {number} teamId
 */
export const deleteTeam = async (teamId) => {
    await apiFetch(`/teams/${teamId}`, 'DELETE');
};

/**
 * Promote team member to team lead
 * @param {number} teamId
 * @param {number} userId
 */
export const promoteToTeamLead = async (teamId, userId) => {
    await apiFetch(`/teams/${teamId}/promote/${userId}`, 'PUT');
};

/**
 * Get team reports and analytics
 * @param {number} teamId
 */
export const getTeamReports = async (teamId) => {
    const reports = await apiFetch(`/teams/${teamId}/reports`);
    return TeamReportsSchema.nullable().parse(reports);
};