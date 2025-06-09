import { z } from "zod/v4";
import { apiFetch } from "./http";
import { userJwtContents } from "./stores";
import { JwtContentsSchema, UserSchema } from "common";

/**
 * @param {import("common").LoginRequest} request 
 */
export const login = async (request) => {
    const user = await apiFetch(`/auth/login`, 'POST', request);
    return UserSchema.parse(user);
};

/**
 * @param {import("common").RegisterRequest} request 
 */
export const register = async (request) => {
    const totpUri = await apiFetch(`/auth/register`, 'POST', request);
    return z.string().parse(totpUri);
};

export const whoami = async () => {
    const jwtContents = await apiFetch(`/auth/whoami`);
    return JwtContentsSchema.and(z.object({
        iat: z.number().optional(),
        exp: z.number().optional(),
    })).parse(jwtContents);
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
    await apiFetch(`/auth/logout${logoutAllSessions ? '?all' : ''}`);
    userJwtContents.set(null);
};
