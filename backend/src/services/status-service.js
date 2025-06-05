import {
  StatusSchema,
  CreateStatusSchema,
  StatusIdSchema,
} from "../../../common/src/schemas/status.js";
import { statusModel } from "../models/status-model.js";
import { z } from "zod";

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
   * @throws {z.ZodError} If statusData is invalid.
   */
  async createStatus(statusData) {
    const validatedData = CreateStatusSchema.parse(statusData);

    const newStatus = await statusModel.create(validatedData.statusName);

    return StatusSchema.parse(newStatus);
  }

  /**
   * Retrieves a status by its ID.
   * @param {number} id - The ID of the status.
   * @returns {Promise<Status | null>} The status if found, otherwise null.
   * @throws {z.ZodError} If id is invalid.
   */
  async getStatusById(id) {
    const validatedId = StatusIdSchema.parse(id);

    const status = await statusModel.findById(validatedId);

    if (!status) {
      return null;
    }
    return StatusSchema.parse(status);
  }

  /**
   * Retrieves all statuses.
   * @returns {Promise<Status[]>} An array of all statuses.
   */
  async getAllStatuses() {
    const statuses = await statusModel.findAll();

    return z.array(StatusSchema).parse(statuses);
  }
}

export const statusService = new StatusService(statusModel);