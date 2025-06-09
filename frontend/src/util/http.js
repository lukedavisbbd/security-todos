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
 * @template B
 * @param {string} path
 * @param {string} method
 * @param {B | undefined} body
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
        return;
    }

    if (resp.ok) {
        return /** @type {unknown} */(await resp.json());
    } else {
        let err;
        try {
            /** @type {import("common").ErrorResponse} */
            err = await resp.json();
        } catch {
            throw new Error('An unexpected error has occurred.');
        }
        if (err.code === 'not_logged_in') {
            userJwtContents.set(null);
        }
        throw new ApiError(err);
    }
};