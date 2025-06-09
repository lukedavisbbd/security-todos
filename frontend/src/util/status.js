import { StatusSchema } from "common";
import { apiFetch } from "./http";

/**
 * Get all available statuses
 */
export const getAllStatuses = async () => {
    const statuses = await apiFetch('/statuses');
    return StatusSchema.array().parse(statuses);
};