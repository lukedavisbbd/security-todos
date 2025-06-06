import { pool } from "../db/pool.js";
import {
  CreateTeamSchema,
  TeamIdSchema,
  UpdateTeamSchema,
} from "../../../common/src/schemas/team.js";

export class TeamModel {
  /**
   * Creates a new team in the database.
   * @param {object} teamData - The team data to create.
   * @param {number} teamData.teamOwnerId - The ID of the user who owns the team.
   * @param {string} teamData.teamName - The name of the team to create.
   * @returns {Promise<import("../../../common/src/schemas/team").Team>} The created team object.
   */
  async create({ teamOwnerId, teamName }) {
    CreateTeamSchema.parse({ teamOwnerId, teamName });
    try {
      const result = await pool.query(
        `INSERT INTO teams (team_owner_id, team_name)
         VALUES ($1, $2)
         RETURNING team_id AS "teamId", team_owner_id AS "teamOwnerId", team_name AS "teamName"`,
        [teamOwnerId, teamName]
      );
      return result.rows[0];
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error("Failed to create team: " + message);
    }
  }

  /**
   * Finds a team by its ID.
   * @param {number} teamId - The ID of the team to find.
   * @returns {Promise<import("../../../common/src/schemas/team").Team | null>} The team object if found, otherwise null.
   */
  async findById(teamId) {
    TeamIdSchema.parse(teamId);
    try {
      const result = await pool.query(
        `SELECT team_id AS "teamId", team_owner_id AS "teamOwnerId", team_name AS "teamName"
         FROM teams
         WHERE team_id = $1`,
        [teamId]
      );
      return result.rows[0] || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error("Failed to find team by ID: " + message);
    }
  }
  /**
   * Updates an existing team's name.
   * @param {number} teamId - The ID of the team to update.
   * @param {string} teamName - The new name for the team.
   * @returns {Promise<import("../../../common/src/schemas/team").Team | null>} The updated team object if found, otherwise null.
   */
  async update(teamId, teamName) {
    TeamIdSchema.parse(teamId);
    UpdateTeamSchema.parse({ teamName });

    try {
      const result = await pool.query(
        `UPDATE teams
         SET team_name = $2
         WHERE team_id = $1
         RETURNING team_id AS "teamId", team_owner_id AS "teamOwnerId", team_name AS "teamName"`,
        [teamId, teamName]
      );
      return result.rows[0] || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error("Failed to update team: " + message);
    }
  }

  /**
   * Lists all teams in the database.
   * @returns {Promise<import("../../../common/src/schemas/team").Team[]>} Array of team objects.
   */
  async findAll() {
    try {
      const result = await pool.query(
        `SELECT team_id AS "teamId", team_owner_id AS "teamOwnerId", team_name AS "teamName"
         FROM teams
         ORDER BY team_id ASC`
      );
      return result.rows;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error("Failed to list teams: " + message);
    }
  }

  /**
   * Finds all teams owned by a specific user.
   * @param {number} ownerId - The ID of the team owner.
   * @returns {Promise<import("../../../common/src/schemas/team").Team[]>} Array of team objects.
   */
  async findByOwnerId(ownerId) {
    try {
      const result = await pool.query(
        `SELECT team_id AS "teamId", team_owner_id AS "teamOwnerId", team_name AS "teamName"
         FROM teams
         WHERE team_owner_id = $1
         ORDER BY team_id ASC`,
        [ownerId]
      );
      return result.rows;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error("Failed to find teams by owner ID: " + message);
    }
  }
}

export const teamModel = new TeamModel();
