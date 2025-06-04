import { apiFetch } from "./http";
import { userJwtContents } from "./stores";

/**
 * @param {import("common").LoginRequest} request 
 */
export const login = async (request) => {
    /**
     * @type {import("./http").ApiResult<import("common").User> | null}
     */
    const result = await apiFetch(`/auth/login`, 'POST', request);

    if (!result)
        return null;

    if ('ok' in result) {
        await whoami();
    }

    return result;
};

/**
 * @param {import("common").RegisterRequest} request 
 */
export const register = async (request) => {
    /**
     * @type {import("./http").ApiResult<import("common").RegisterResponse> | null}
     */
    const result = await apiFetch(`/auth/register`, 'POST', request);

    if (!result)
        return null;

    if ('ok' in result) {
        await whoami();
    }

    return result;
};

export const whoami = async () => {
    /**
     * @type {import("./http").ApiResult<import("common").JwtContents & { iat?: number, exp?: number }> | null}
     */
    const result = await apiFetch(`/auth/whoami`);

    if (!result)
        return null;

    if ('ok' in result) {
        userJwtContents.set(result.ok);
    }

    return result;
};

/**
 * @param {boolean} logoutAllSessions
 */
export const logout = async (logoutAllSessions = false) => {
    /**
     * @type {import("./http").ApiResult<{ message: 'success' }> | null}
     */
    const result = await apiFetch(`/auth/logout${logoutAllSessions ? '?all' : ''}`);

    if (!result)
        return null;
    
    if ('ok' in result) {
        userJwtContents.set(null);
        return result.ok;
    } else {
        return null;
    }
};
