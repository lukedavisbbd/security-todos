import { z } from 'zod/v4';

const digitRegex = /^[0-9]*$/;

/** @param {unknown} value */
const trimUnknown = (value) => typeof value === 'string' ? value.trim() : value;

export const LoginRequestSchema = z.object({
    email: z.preprocess(trimUnknown, z.email().max(128, { error: 'Email is too long.' })),
    password: z.preprocess(trimUnknown,
        z.string()
        .min(12, { error: 'Password must be at least 12 characters long.' })
        .max(128, { error: 'Password is too long.' })
    ),
    twoFactor: z.string()
        .length(6, { error: '2FA pin must be exactly 6 digits.' })
        .refine(string => digitRegex.test(string), { error: '2FA pin may only contain digits.' }),
});

/**
 * @typedef {z.infer<typeof LoginRequestSchema>} LoginRequest
 */

export const RegisterRequestSchema = z.object({
    email: z.preprocess(trimUnknown, z.email().max(128, { error: 'Email is too long.' })),
    // https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#implement-proper-password-strength-controls
    // OWasp: password must have a minimum length at least 12 and a maximum length no less than 64 to allow passphrases
    // We've allowed up to 128, as extremely large passwords can causing a hashing DOS. (https://www.acunetix.com/vulnerabilities/web/long-password-denial-of-service/)
    password: z.preprocess(trimUnknown,
        z.string()
        .min(12, { error: 'Password must be at least 12 characters long.' })
        .max(128, { error: 'Password is too long.' })
    ),
    name: z.preprocess(trimUnknown,
        z.string()
        .nonempty({ error: 'Name may not be empty.' })
        .max(64, { error: 'Name is too long.' })
    ),
});

/**
 * @typedef {z.infer<typeof RegisterRequestSchema>} RegisterRequest
 */

export const UserSchema = z.object({
    userId: z.number(),
    email: z.email(),
    name: z.string().nonempty(),
    emailVerified: z.boolean(),
});

/**
 * @typedef {z.infer<typeof UserSchema>} User
 */

export const JwtContentsSchema = z.object({
    user: UserSchema,
    roles: z.array(z.string()),
});

/**
 * @typedef {z.infer<typeof JwtContentsSchema>} JwtContents
 */

/**
 * @typedef {{
 *     user: User,
 *     totpUri: string,
 * }} RegisterResponse
 */
