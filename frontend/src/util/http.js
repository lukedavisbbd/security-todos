import { userJwtContents } from "./stores";

/**
 * @template T
 * @typedef {{ ok: T } | { ok: true, status: 204} | { err: import("common").ErrorResponse }} ApiResult
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

        if (resp.status === 204) {
            return { ok: true, status: 204 };
        }

        /**
         * @type {ApiResult<T>}
         */
        const result = resp.ok ? {
            ok: await resp.json(),
        } : {
            err: await resp.json()
        };

        if ('err' in result && result.err.code === 'not_logged_in') {
            userJwtContents.set(null);
        }
        return result;
    } catch (err) {
        console.log(err);
        return null;
    }
};
