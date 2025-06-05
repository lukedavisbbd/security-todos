import { pool } from "../db/pool.js";

export class StatusModel {
  /**
   * Creates a new status in the database.
   * @param {string} statusName - The name of the status to create.
   * @returns {Promise<import("../../../common/src/schemas/status").Status>} The created status object.
   */
  async create(statusName) {
    const result = await pool.query(
      `INSERT INTO statuses (status_name)
       VALUES ($1)
       RETURNING status_id AS "statusId", status_name AS "statusName"`,
      [statusName]
    );
    return result.rows[0];
  }

  /**
   * Finds a status by its ID.
   * @param {number} statusId - The ID of the status to find.
   * @returns {Promise<import("../../../common/src/schemas/status").Status | undefined>} The status object if found, otherwise undefined.
   */
  async findById(statusId) {
    const result = await pool.query(
      `SELECT status_id AS "statusId", status_name AS "statusName"
       FROM statuses
       WHERE status_id = $1`,
      [statusId]
    );
    return result.rows[0];
  }

  /**
   * Finds all statuses.
   * @returns {Promise<import("../../../common/src/schemas/status").Status[]>} An array of status objects.
   */
  async findAll() {
    const result = await pool.query(
      `SELECT status_id AS "statusId", status_name AS "statusName"
       FROM statuses
       ORDER BY status_id`
    );
    return result.rows;
  }
}

export const statusModel = new StatusModel();