import { apiFetch } from "./http";
import { userJwtContents } from "./stores";

/**
 * @param {import("common").LoginRequest} request 
 */
export const login = async (request) => {
    /**
     * @type {import("common").User}
     */
    const result = await apiFetch(`/auth/login`, 'POST', request);

    return result;
};

/**
 * @param {import("common").RegisterRequest} request 
 */
export const register = async (request) => {
    /** @type {string} */
    const result = await apiFetch(`/auth/register`, 'POST', request);
    
    return result;
};

export const whoami = async () => {
    /** @type {import("common").JwtContents & { iat?: number, exp?: number }} */
    const result = await apiFetch(`/auth/whoami`);

    userJwtContents.set(result);

    return result;
};

export const checkAuth = async () => {
    // check if logged in, otherwise do nothing
    try {
        const jwtContents = await whoami();
        userJwtContents.set(jwtContents);
    } catch {}
};

/**
 * @param {boolean} logoutAllSessions
 */
export const logout = async (logoutAllSessions = false) => {
    /**
     * @type {{ message: 'success' }}
     */
    await apiFetch(`/auth/logout${logoutAllSessions ? '?all' : ''}`);
    userJwtContents.set(null);
};
