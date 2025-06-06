import { userJwtContents } from "./stores";

/**
 * @template T
 * @typedef {{ ok: T } | { err: import("common").ErrorResponse }} ApiResult
 */

/**
 * @template T
 * @template B
 * @param {string} path
 * @param {string} method
 * @param {B | undefined} body
 */
export const apiFetch = async (path, method = 'GET', body = undefined) => {
    try {
        const resp = await fetch(`/api${path}`, {
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            },
            method,
            body: JSON.stringify(body),
        });

        /**
         * @type {ApiResult<T>}
         */
        const result = resp.ok ? {
            ok: await resp.json(),
        } : {
            err: await resp.json()
        };

        if ('err' in result) {
            if (result.err.code === 'not_logged_in') {
                userJwtContents.set(null);
            }
        }

        return result;
    } catch {
        return null;
    }
};
