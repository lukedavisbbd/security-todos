import { apiFetch } from "./http";

/**
 * Get all available statuses
 * @returns {Promise<import("./http").ApiResult<Array<{ status_id: number, status_name: string }>> | null>}
 */
export const getAllStatuses = async () => {
    return await apiFetch('/statuses');
};