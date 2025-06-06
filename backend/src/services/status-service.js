import {
  StatusSchema,
  CreateStatusSchema,
  StatusIdSchema,
} from "../../../common/src/schemas/status.js";
import { statusModel } from "../models/status-model.js";
import { z } from "common";

/**
 * @typedef {import("../../../common/src/schemas/status").Status} Status
 * @typedef {import("../../../common/src/schemas/status").CreateStatusInput} CreateStatusInput
 * @typedef {import("../../../common/src/schemas/status").UpdateStatusInput} UpdateStatusInput
 * @typedef {import("../../../common/src/schemas/status").StatusId} StatusId
 */

export class StatusService {
  /**
   * @param {import("../models/status-model").StatusModel} statusModelInstance
   */
  constructor(statusModelInstance) {
    this.statusModel = statusModelInstance;
  }

  /**
   * Creates a new status.
   * @param {CreateStatusInput} statusData - The data for the new status.
   * @returns {Promise<Status>} The created status.
   * @throws {z.ZodError|Error} If statusData is invalid or output is invalid.
   */
  async createStatus(statusData) {
    const validatedData = CreateStatusSchema.parse(statusData);
    const newStatus = await statusModel.create(validatedData.statusName);
    const parsed = StatusSchema.safeParse(newStatus);

    if (!parsed.success) {
      throw parsed.error;
    }

    return parsed.data;
  }

  /**
   * Retrieves a status by its ID.
   * @param {number} id - The ID of the status.
   * @returns {Promise<Status | null>} The status if found, otherwise null.
   * @throws {z.ZodError|Error} If id is invalid or output is invalid.
   */
  async getStatusById(id) {
    const validatedId = StatusIdSchema.parse(id);
    const status = await statusModel.findById(validatedId);

    if (!status) {
      return null;
    }

    const parsed = StatusSchema.safeParse(status);

    if (!parsed.success) {
      throw parsed.error;
    }

    return parsed.data;
  }

  /**
   * Retrieves all statuses.
   * @returns {Promise<Status[]>} An array of all statuses.
   * @throws {Error} If output is invalid.
   */
  async getAllStatuses() {
    const statuses = await statusModel.findAll();
    const parsed = z.array(StatusSchema).safeParse(statuses);

    if (!parsed.success) {
      throw parsed.error;
    }

    return parsed.data;
  }
}

export const statusService = new StatusService(statusModel);
