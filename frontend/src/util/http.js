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
 * @returns {Promise<ApiResult<T> | null>}
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
            return /** @type {ApiResult<T>} */({ ok: /** @type {T} */({}) });
        }

        /**
         * @type {ApiResult<T>}
         */
        const result = resp.ok ? {
            ok: /** @type {T} */(await resp.json()),
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