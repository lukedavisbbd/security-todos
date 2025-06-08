import { userJwtContents } from "./stores";

export class ApiError extends Error {
    /** @type {import("common").ErrorResponse} */
    errorResponse;

    /** @param {import("common").ErrorResponse} errorResponse */
    constructor(errorResponse) {
        super(errorResponse.message);
        this.errorResponse = errorResponse;
    }
}

/**
 * @template T
 * @template B
 * @param {string} path
 * @param {string} method
 * @param {B | undefined} body
 * @returns {Promise<T>}
 */
export const apiFetch = async (path, method = 'GET', body = undefined) => {
    const resp = await fetch(`/api${path}`, {
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
        },
        method,
        body: JSON.stringify(body),
    });

    if (resp.status === 204) {
        return /** @type {T} */(null);
    }

    if (resp.ok) {
        return /** @type {T} */(await resp.json());
    } else {
        /** @type {import("common").ErrorResponse} */
        const err = await resp.json();
        if (err.code === 'not_logged_in') {
            userJwtContents.set(null);
        }
        throw new ApiError(err);
    }
};