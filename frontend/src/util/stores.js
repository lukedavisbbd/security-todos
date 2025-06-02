import { writable } from "svelte/store";

/**
 * @type {import("svelte/store").Writable<import("common").JwtContents | null>}
 */
export const userJwtContents = writable(null);
