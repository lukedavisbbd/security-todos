import { derived, writable } from "svelte/store";

/**
 * @type {import("svelte/store").Writable<import("common").JwtContents | null>}
 */
export const userJwtContents = writable(null);

export const userInitials = derived(userJwtContents, $userJwtContents => 
    ($userJwtContents?.user?.name ?? '')
        .split(' ')
        .map(n => n.substring(0, 1).toUpperCase())
        .join('')
);

/**
 * @param {string} input
 */
const hashSha256Hex = async (input) => {
    const inBuffer = new TextEncoder().encode(input);
    const outBuffer = await window.crypto.subtle.digest('SHA-256', inBuffer);
    return [...new Uint8Array(outBuffer)].map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * @param {string} email 
 */
export const gravatarUrl = async (email) => {
    if (email && window.crypto) {
        const hash = await hashSha256Hex(email.trim().toLowerCase());
        return `https://gravatar.com/avatar/${hash}?d=identicon`;
    } else {
        return '';
    }
};

export const userProfileLogoSrc = derived(userJwtContents, ($userJwtContents) => gravatarUrl($userJwtContents?.user.email ?? ''));
