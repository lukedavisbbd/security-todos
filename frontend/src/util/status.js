import { apiFetch } from "./http";

/**
 * Get all available statuses
 * @returns {Promise<{ status_id: number, status_name: string }[]>}
 */
export const getAllStatuses = async () => {
    return await apiFetch('/statuses');
};