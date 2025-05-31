import { z } from 'zod/v4';

const twoFactorOtpRegex = /^[0-9]{6}$/; // exactly 6 digits
const twoFactorError = '2FA pin must be exactly 6 digits.';

const trimUnknown = (value: unknown) => typeof value === 'string' ? value.trim() : value;

export const LoginRequest = z.object({
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

export type LoginRequest = typeof LoginRequest._output;

export const RegisterRequest = z.object({
    email: z.preprocess(trimUnknown, z.email()),
    // https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#implement-proper-password-strength-controls
    // OWasp: password must have a minimum length at least 12 and a maximum length no less than 64 to allow passphrases
    // We've allowed up to 128, as extremely large passwords can causing a hashing DOS. (https://www.acunetix.com/vulnerabilities/web/long-password-denial-of-service/)
    password: z.preprocess(trimUnknown,
        z.string()
        .min(12, { error: 'Password must be at least 12 characters long.' })
        .max(128, { error: 'Password must be no more than 128 characters long.' })
    ),
});

export type RegisterRequest = typeof RegisterRequest._output;

export const User = z.object({
    userId: z.number(),
    email: z.email(),
    emailVerified: z.boolean(),
});

export type User = typeof User._output;

export const JwtContents = z.object({
    user: User,
    roles: z.array(z.string()),
});

export type JwtContents = typeof JwtContents._output;

export type RegisterResponse = {
    user: User,
    totpUri: string,
};
