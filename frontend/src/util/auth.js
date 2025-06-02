import { apiFetch } from "./http";
import { userJwtContents } from "./stores";

/**
 * @param {import("common").LoginRequest} request 
 */
export const login = async (request) => {
    const result = await apiFetch(`/auth/login`, 'POST', request);

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
     * @type {import("./http").ApiResult<import("common").RegisterResponse>}
     */
    const result = await apiFetch(`/auth/register`, 'POST', request);

    if ('ok' in result) {
        await whoami();
    }

    return result;
};

export const whoami = async () => {
    /**
     * @type {import("./http").ApiResult<import("common").JwtContents & { iat?: number, exp?: number }>}
     */
    const result = await apiFetch(`/auth/whoami`);

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
     * @type {import("./http").ApiResult<{ message: 'success' }>}
     */
    const result = await apiFetch(`/auth/logout${logoutAllSessions ? '?all' : ''}`);
    
    if ('ok' in result) {
        userJwtContents.set(null);
    }
    
    return;
};
