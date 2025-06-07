import { pool } from "../db/pool.js";
import {
  CreateTaskHistorySchema,
  TaskHistorySchema,
  TaskHistoryDataSchema,
} from "common";
import { z } from "common";

export class HistoryModel {
  /**
   * @param {z.infer<typeof CreateTaskHistorySchema>} History - The task history data to create.
   * @returns {Promise<z.infer<typeof TaskHistorySchema>>} - The created task history object.
   * @throws {Error} - If the creation fails, an error is thrown with a message.
   */
  static async create({ taskId, statusId, assignedToId }) {
    const validatedData = CreateTaskHistorySchema.parse({
      taskId,
      statusId,
      assignedToId,
    });

    const query = `
            INSERT INTO history (task_id, status_id, assigned_to_id)
            VALUES ($1, $2, $3)
            RETURNING history_id, task_id, status_id, assigned_to_id, timestamp
        `;

    const values = [
      validatedData.taskId,
      validatedData.statusId,
      validatedData.assignedToId,
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to create task history: ${message}`);
    }
  }

  /**
   * Updates the status of a task history record
   * @param {number} historyId - The ID of the history record to update
   * @param {number} statusId - The new status ID
   * @returns {Promise<z.infer<typeof TaskHistorySchema>>} - The updated task history object
   * @throws {Error} - If the update fails, an error is thrown with a message
   */ static async update(historyId, statusId) {
    const statusCheckQuery = `
      SELECT status_id FROM statuses WHERE status_id = $1
    `;

    try {
      const statusResult = await pool.query(statusCheckQuery, [statusId]);
      if (statusResult.rows.length === 0) {
        throw new Error(`Status with ID ${statusId} does not exist`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to validate status: ${message}`);
    }

    const query = `
      UPDATE history
      SET status_id = $2
      WHERE history_id = $1
      RETURNING history_id, task_id, status_id, assigned_to_id, timestamp
    `;

    const values = [historyId, statusId];

    try {
      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        throw new Error(`History record with ID ${historyId} not found`);
      }

      return result.rows[0];
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to update task history: ${message}`);
    }
  }

  /**
   * Gets all history records for a specific task
   * @param {number} taskId - The ID of the task to get history for
   * @returns {Promise<z.infer<typeof TaskHistoryDataSchema>[]>} - Array of task history objects
   * @throws {Error} - If the query fails, an error is thrown with a message
   */
  static async getByTaskId(taskId) {
    const query = `
      SELECT h.history_id, 
            h.task_id, 
            h.status_id, 
            h.assigned_to_id, 
            h.timestamp, 
            t.task_name,
            s.status_name
      FROM history h 
      INNER JOIN tasks t ON h.task_id = t.task_id
      INNER JOIN statuses s ON h.status_id = s.status_id
      WHERE task_id = $1
      ORDER BY timestamp DESC
    `;

    try {
      const result = await pool.query(query, [taskId]);
      return result.rows;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to get task history: ${message}`);
    }
  }
}
