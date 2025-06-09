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
