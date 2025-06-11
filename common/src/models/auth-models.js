import { z } from 'zod/v4';

const digitRegex = /^[0-9]*$/;
const hexRegex = /^[a-fA-F0-9]*$/;

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
    // https://pages.nist.gov/800-63-3/sp800-63b.html
    // NIST Digital Identity Guidelines Section 5.1.1.2
    // Recommends: 
    // * minimum length at least 8 (we've chosen 12)
    // * max length at least 64, we've allowed up to 128,
    //   as extremely large passwords can causing a hashing DOS. (https://www.acunetix.com/vulnerabilities/web/long-password-denial-of-service/)
    // * checking passwords against known data breaches (we're using pwned passwords list)
    // * having show password button
    // Recommends against:
    // * periodic password rotation
    // * arbitrary composition rules (e.g., requiring mixtures of different character types or prohibiting consecutively repeated characters)
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

export const ChangePasswordRequestSchema = z.object({
    oldPassword: z.preprocess(trimUnknown,
        z.string()
        .min(12, { error: 'Password must be at least 12 characters long.' })
        .max(128, { error: 'Password is too long.' })
    ),
    newPassword: z.preprocess(trimUnknown,
        z.string()
        .min(12, { error: 'Password must be at least 12 characters long.' })
        .max(128, { error: 'Password is too long.' })
    ),
    twoFactor: z.string()
        .length(6, { error: '2FA pin must be exactly 6 digits.' })
        .refine(string => digitRegex.test(string), { error: '2FA pin may only contain digits.' }),
});

/**
 * @typedef {z.infer<typeof ChangePasswordRequestSchema>} ChangePasswordRequest
 */

export const ResetPasswordRequestSchema = z.object({
    resetToken: z.preprocess(trimUnknown,
        z.string()
        .length(64, { error: 'Reset token must be exactly 64 characters characters.' })
        .refine(string => hexRegex.test(string), { error: 'Reset token may only contain hexadecimal characters.' }),
    ),
    newPassword: z.preprocess(trimUnknown,
        z.string()
        .min(12, { error: 'Password must be at least 12 characters long.' })
        .max(128, { error: 'Password is too long.' })
    ),
    twoFactor: z.string()
        .length(6, { error: '2FA pin must be exactly 6 digits.' })
        .refine(string => digitRegex.test(string), { error: '2FA pin may only contain digits.' }),
});

/**
 * @typedef {z.infer<typeof ResetPasswordRequestSchema>} ResetPasswordRequest
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

export const UserWithRolesSchema = z.object({
    user: UserSchema,
    roles: z.array(z.string()),
});

/**
 * @typedef {z.infer<typeof UserWithRolesSchema>} UserWithRoles
 */

export const JwtContentsSchema = UserWithRolesSchema;

/**
 * @typedef {z.infer<typeof JwtContentsSchema>} JwtContents
 */

export const PublicUserSchema = z.object({
    userId: z.number(),
    name: z.string().nonempty(),
});

/**
 * @typedef {z.infer<typeof PublicUserSchema>} PublicUser
 */
