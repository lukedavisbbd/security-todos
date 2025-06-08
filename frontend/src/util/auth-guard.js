import { goto } from "@mateothegreat/svelte5-router";
import { userJwtContents } from "./stores";
import { derived } from "svelte/store";

/**
 * Authentication guard options
 * @typedef {{
 *   requireAuth?: boolean,
 *   requireRoles?: string[],
 *   redirectTo?: string,
 *   onUnauthorized?: () => void
 * }} AuthGuardOptions
 */

/**
 * Create an authentication guard store
 * @param {AuthGuardOptions} options
 * @returns {import('svelte/store').Readable<{ isAuthorized: boolean, isLoading: boolean }>}
 */
export function createAuthGuard(options = {}) {
    const {
        requireAuth = true,
        requireRoles = [],
        redirectTo = '/',
        onUnauthorized
    } = options;

    return derived(userJwtContents, (currentUser) => {
        // Wait for auth state to be determined
        if (currentUser === undefined) {
            return { isAuthorized: false, isLoading: true };
        }

        // Check if authentication is required
        if (requireAuth && currentUser === null) {
            if (onUnauthorized) {
                onUnauthorized();
            } else {
                goto(redirectTo)
            }
            return { isAuthorized: false, isLoading: false };
        }

        // Check role requirements
        if (requireRoles.length > 0 && currentUser) {
            const hasRequiredRole = requireRoles.some(role => 
                currentUser.roles.includes(role)
            );
            
            if (!hasRequiredRole) {
                if (onUnauthorized) {
                    onUnauthorized();
                } else {
                    // Redirect to teams if user is logged in but lacks required role
                    goto(currentUser ? '/teams' : redirectTo);
                }
                return { isAuthorized: false, isLoading: false };
            }
        }

        // User is authorized
        return { isAuthorized: true, isLoading: false };
    });
}

/**
 * Simple authentication check (logged in or not)
 * @param {string} redirectTo - Where to redirect if not logged in
 * @returns {import('svelte/store').Readable<{ isAuthorized: boolean, isLoading: boolean }>}
 */
export function requireAuth(redirectTo = '/') {
    return createAuthGuard({
        requireAuth: true,
        redirectTo
    });
}

/**
 * Require specific roles
 * @param {string[]} roles - Required roles
 * @param {string} redirectTo - Where to redirect if unauthorized
 * @returns {import('svelte/store').Readable<{ isAuthorized: boolean, isLoading: boolean }>}
 */
export function requireRoles(roles, redirectTo = '/teams') {
    return createAuthGuard({
        requireAuth: true,
        requireRoles: roles,
        redirectTo
    });
}

/**
 * Require admin role specifically
 * @returns {import('svelte/store').Readable<{ isAuthorized: boolean, isLoading: boolean }>}
 */
export function requireAdmin() {
    return requireRoles(['access_admin'], '/teams');
}