import {
  TeamSchema,
  CreateTeamSchema,
  TeamIdSchema,
  UpdateTeamSchema,
} from "../../../common/src/schemas/team.js";
import { teamModel } from "../models/team-model.js";
import { z } from "common";

/**
 * @typedef {import("../../../common/src/schemas/team").Team} Team
 * @typedef {import("../../../common/src/schemas/team").CreateTeamInput} CreateTeamInput
 * @typedef {import("../../../common/src/schemas/team").UpdateTeamInput} UpdateTeamInput
 * @typedef {import("../../../common/src/schemas/team").TeamId} TeamId
 */

export class TeamService {
  /**
   * @param {import("../models/team-model").TeamModel} teamModelInstance
   */
  constructor(teamModelInstance) {
    this.teamModel = teamModelInstance;
  }

  /**
   * Creates a new team.
   * @param {CreateTeamInput} teamData - The data for the new team.
   * @returns {Promise<Team>} The created team.
   * @throws {z.ZodError|Error} If teamData is invalid or output is invalid.
   */
  async createTeam(teamData) {
    const validatedData = CreateTeamSchema.parse(teamData);
    const newTeam = await this.teamModel.create(validatedData);
    const parsed = TeamSchema.safeParse(newTeam);

    if (!parsed.success) {
      throw parsed.error;
    }

    return parsed.data;
  }

  /**
   * Updates a team's name if the requester is the team owner.
   * @param {number} teamId - The ID of the team to update.
   * @param {string} teamName - The new name for the team.
   * @param {number} requesterId - The ID of the user making the request.
   * @returns {Promise<Team>} The updated team.
   * @throws {Error} If the team doesn't exist or if the requester isn't the owner.
   */
  async updateTeamName(teamId, teamName, requesterId) {
    TeamIdSchema.parse(teamId);
    UpdateTeamSchema.parse({ teamName });

    const team = await this.teamModel.findById(teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    if (team.teamOwnerId !== requesterId) {
      throw new Error("Only the team owner can update the team");
    }

    const updatedTeam = await this.teamModel.update(teamId, teamName);
    const parsed = TeamSchema.safeParse(updatedTeam);

    if (!parsed.success) {
      throw parsed.error;
    }

    return parsed.data;
  }

  /**
   * Retrieves a team by its ID.
   * @param {number} id - The ID of the team.
   * @returns {Promise<Team | null>} The team if found, otherwise null.
   * @throws {z.ZodError|Error} If id is invalid or output is invalid.
   */
  async getTeamById(id) {
    const validatedId = TeamIdSchema.parse(id);
    const team = await this.teamModel.findById(validatedId);
    
    if (!team) {
      return null;
    }

    const parsed = TeamSchema.safeParse(team);
    if (!parsed.success) {
      throw parsed.error;
    }

    return parsed.data;
  }

  /**
   * Lists all teams.
   * @returns {Promise<Team[]>} Array of teams.
   * @throws {z.ZodError|Error} If output is invalid.
   */
  async getAllTeams() {
    const teams = await this.teamModel.findAll();
    const parsed = z.array(TeamSchema).safeParse(teams);

    if (!parsed.success) {
      throw parsed.error;
    }

    return parsed.data;
  }

  /**
   * Lists all teams owned by a specific user.
   * @param {number} ownerId - The ID of the team owner.
   * @returns {Promise<Team[]>} Array of teams.
   * @throws {z.ZodError|Error} If output is invalid.
   */
  async getTeamsByOwnerId(ownerId) {
    const teams = await this.teamModel.findByOwnerId(ownerId);
    const parsed = z.array(TeamSchema).safeParse(teams);

    if (!parsed.success) {
      throw parsed.error;
    }

    return parsed.data;
  }
}

export const teamService = new TeamService(teamModel);
