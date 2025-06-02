import { z } from 'zod/v4';

const twoFactorOtpRegex = /^[0-9]{6}$/; // exactly 6 digits
const twoFactorError = '2FA pin must be exactly 6 digits.';

/** @param {unknown} value */
const trimUnknown = (value) => typeof value === 'string' ? value.trim() : value;

export const LoginRequestSchema = z.object({
    email: z.preprocess(trimUnknown, z.email()),
    password: z.preprocess(trimUnknown,
        z.string()
        .nonempty({ error: 'Password must not be empty.' })
        .max(512, { error: 'Password is too long.' })
    ),
    twoFactor: z.string()
        .length(6, { error: twoFactorError })
        .refine(string => twoFactorOtpRegex.test(string), { error: twoFactorError }),
});

/**
 * @typedef {z.infer<typeof LoginRequestSchema>} LoginRequest
 */

export const RegisterRequestSchema = z.object({
    email: z.preprocess(trimUnknown, z.email()),
    // https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#implement-proper-password-strength-controls
    // OWasp: password must have a minimum length at least 12 and a maximum length no less than 64 to allow passphrases
    // We've allowed up to 128, as extremely large passwords can causing a hashing DOS. (https://www.acunetix.com/vulnerabilities/web/long-password-denial-of-service/)
    password: z.preprocess(trimUnknown,
        z.string()
        .min(12, { error: 'Password must be at least 12 characters long.' })
        .max(128, { error: 'Password must be no more than 128 characters long.' })
    ),
    name: z.preprocess(trimUnknown,
        z.string()
        .nonempty({ error: 'Name may not be empty.' })
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
