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

/**
 * @param {number} userId
 * @param {import('common').ResetPasswordRequest} request
 */
export const resetPassword = async (userId, request) => {
    await apiFetch(`/auth/password/reset/${userId}`, 'POST', request);
    userJwtContents.set(null);
};

/**
 * @param {string} input
 */
const hashSha1Hex = async (input) => {
    const inBuffer = new TextEncoder().encode(input);
    const outBuffer = await window.crypto.subtle.digest('SHA-1', inBuffer);
    return [...new Uint8Array(outBuffer)].map(x => x.toString(16).padStart(2, '0')).join('');
}

export const pwnedPasswordCount = (async (password) => {
    try {
        const pwd = password.trim();
        if (!pwd || pwd.length < 12) return 0;

        const hash = (await hashSha1Hex(password.trim())).toLowerCase();
        const truncatedHash = hash.substring(0, 5);

        // only the first 5 characters are sent to the external service
        // proof that the password cannot be reconstructed
        // https://www.troyhunt.com/ive-just-launched-pwned-passwords-version-2/
        const resp = await fetch(`https://api.pwnedpasswords.com/range/${truncatedHash}`);
        const text = await resp.text();
        const lines = text.toLowerCase().split('\r\n');

        for (let i = 0; i < lines.length; i++) {
            const [hashRest, count] = lines[i].split(':');
            const hashFull = truncatedHash + hashRest;

            if (hashFull == hash) {
                return parseInt(count);
            }
        }
        
        return 0;
    } catch {
        return 0;
    }
})