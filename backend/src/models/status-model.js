import { pool } from "../db/pool.js";
import {
  CreateStatusSchema,
  StatusIdSchema,
} from "../../../common/src/schemas/status.js";

export class StatusModel {
  /**
   * Creates a new status in the database.
   * @param {string} statusName - The name of the status to create.
   * @returns {Promise<import("../../../common/src/schemas/status").Status>} The created status object.
   */
  async create(statusName) {
    CreateStatusSchema.parse({ statusName });
    try {
      const result = await pool.query(
        `INSERT INTO statuses (status_name)
         VALUES ($1)
         RETURNING status_id AS "statusId", status_name AS "statusName"`,
        [statusName]
      );
      return result.rows[0];
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error("Failed to create status: " + message);
    }
  }

  /**
   * Finds a status by its ID.
   * @param {number} statusId - The ID of the status to find.
   * @returns {Promise<import("../../../common/src/schemas/status").Status | null>} The status object if found, otherwise null.
   */
  async findById(statusId) {
    StatusIdSchema.parse(statusId);
    try {
      const result = await pool.query(
        `SELECT status_id AS "statusId", status_name AS "statusName"
         FROM statuses
         WHERE status_id = $1`,
        [statusId]
      );
      return result.rows[0] || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error("Failed to find status by ID: " + message);
    }
  }

  /**
   * Finds all statuses.
   * @returns {Promise<import("../../../common/src/schemas/status").Status[]>} An array of status objects.
   */
  async findAll() {
    try {
      const result = await pool.query(
        `SELECT status_id AS "statusId", status_name AS "statusName"
         FROM statuses
         ORDER BY status_id`
      );
      return result.rows;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error("Failed to find all statuses: " + message);
    }
  }
}

export const statusModel = new StatusModel();
