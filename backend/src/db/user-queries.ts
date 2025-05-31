import { AppError, JwtContents, LoginRequest, RegisterRequest, RegisterResponse, User } from 'common';
import { pool } from './pool';
import crypto from 'crypto';
import * as pg from 'pg';
import * as bcrypt from 'bcrypt';
import * as authenticator from 'authenticator';
import config from '../config/config';

const saltRounds = 10;

const encryptionAlgorithm = 'aes-256-gcm';

const encrypt = async (text: string) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(encryptionAlgorithm, config.masterKey2fa, iv);
    const encryptedText = cipher.update(text, 'utf8', 'hex');
    
    return iv.toString('hex') + ':' + encryptedText;
}

const decrypt = async (text: string) => {
    const [ivString, data] = text.split(':');

    if (!ivString || !data) return undefined;

    const iv = Buffer.from(ivString, 'hex');
    const cipher = crypto.createDecipheriv(encryptionAlgorithm, config.masterKey2fa, iv);
    const textDecrypted = cipher.update(data, 'hex', 'utf8');
    
    return textDecrypted;
}

const generateRefreshToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

const mapRowToUserInfo = (row: any) => {
    if (!row)
        return null;

    const userId = row.user_id as number | undefined;
    const passwordHash = row.password as string | undefined;
    const email = row.email as string | undefined;
    const emailVerified = row.email_verified as boolean | undefined;
    const twoFactorKeyEncrypted = row.two_factor_key as string | undefined;
    const refreshTokenHash = row.refresh_token as string | null;

    if (!userId || !passwordHash || !email || typeof emailVerified === 'undefined' || !twoFactorKeyEncrypted) {
        console.error(`failed to map row to user ${userId}`);
        throw new AppError();
    }

    return {
        userId,
        passwordHash,
        email,
        emailVerified,
        twoFactorKeyEncrypted,
        refreshTokenHash,
    };
};

export const fetchRoles = async (userId: number) => {
    const result = await pool.query('SELECT role_name FROM user_roles NATURAL JOIN roles WHERE user_id = $1', [userId]);
    return result.rows.map(row => row.role_name as string);
};

export const clearRefreshTokens = async (userId: number) => {
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
};

export const loginWithToken = async (userId: number, refreshToken: string) => {
    const result = await pool.query('SELECT user_id, email, password, email_verified, two_factor_key, refresh_token FROM users NATURAL JOIN refresh_tokens WHERE user_id = $1 AND expiry > NOW()', [userId]);
    const users = result.rows.map(mapRowToUserInfo);

    const tokenComparisons = (await Promise.all(users.map(async (userInfo) => {
        if (userInfo?.refreshTokenHash) {
            return {
                userInfo,
                matches: await bcrypt.compare(refreshToken, userInfo.refreshTokenHash),
            };
        }
        return {
            userInfo,
            matches: false,
        };
    }))).filter(({ userInfo, matches }) => userInfo && matches);

    const userMatch = tokenComparisons[0];

    if (!userMatch)
        return null;

    // delete old token
    const { userInfo } = userMatch;
    const oldTokenHash = userInfo!.refreshTokenHash;
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1 AND refresh_token = $2', [userId, oldTokenHash]);

    const newToken = generateRefreshToken();
    const newTokenHash = await bcrypt.hash(newToken, saltRounds);
    await pool.query('INSERT INTO refresh_tokens (user_id, refresh_token) VALUES ($1, $2)', [userId, newTokenHash]);

    const user: User = {
        userId: userInfo!.userId,
        email: userInfo!.email,
        emailVerified: userInfo!.emailVerified,
    };

    const jwtContents: JwtContents = {
        user,
        roles: await fetchRoles(user.userId),
    };

    return {
        user,
        jwtContents,
        newToken,
    };
};

export const loginUser = async (request: LoginRequest) => {
    const result = await pool.query('SELECT user_id, email, password, email_verified, two_factor_key FROM users WHERE email = $1', [request.email]);
    const userInfo = mapRowToUserInfo(result.rows[0]);

    if (!userInfo)
        return null;

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = await bcrypt.hash(refreshToken, saltRounds);
    await pool.query('INSERT INTO refresh_tokens (user_id, refresh_token) VALUES ($1, $2)', [userInfo.userId, refreshTokenHash]);

    const twoFactorKey = await decrypt(userInfo.twoFactorKeyEncrypted);

    if (!twoFactorKey) {
        console.error('two factor key invalid');
        throw new AppError();
    }

    // verify password
    if (!await bcrypt.compare(request.password, userInfo.passwordHash))
        return null;

    // verify 2FA
    if (!authenticator.verifyToken(twoFactorKey, request.twoFactor))
        throw new AppError({
            code: 'validation_error',
            status: 400,
            message: 'Failed two factor authentication.',
            data: {
                errors: ['Failed two factor authentication.']
            }
        });
    
    const user: User = {
        userId: userInfo.userId,
        email: userInfo.email,
        emailVerified: userInfo.emailVerified,
    };
    
    const jwtContents: JwtContents = {
        user,
        roles: await fetchRoles(user.userId),
    };

    return {
        user,
        jwtContents,
        refreshToken,
    };
};

export const registerUser = async (request: RegisterRequest) => {
    const twoFactorKey = authenticator.generateKey();
    const twoFactorKeyEncrypted = await encrypt(twoFactorKey);
    const passwordHash = await bcrypt.hash(request.password, saltRounds);
    let userInfo;

    try {
        const result = await pool.query('INSERT INTO users (email, password, two_factor_key) VALUES ($1, $2, $3) RETURNING user_id, email, password, email_verified, two_factor_key', [request.email, passwordHash, twoFactorKeyEncrypted]);
        userInfo = mapRowToUserInfo(result.rows[0]);
    } catch (error) {
        if (error instanceof pg.DatabaseError && error.constraint === 'users_email_key') {
            const data = {
                errors: [],
                properties: {
                    email: {
                        errors: ['Email address already taken.']
                    }
                }
            };

            throw new AppError({
                code: 'validation_error',
                status: 400,
                message: 'Email address already taken.',
                data,
            });
        }
        throw error;
    }

    if (!userInfo) {
        console.error('failed to add user');
        throw new AppError();
    }

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = await bcrypt.hash(refreshToken, saltRounds);
    await pool.query('INSERT INTO refresh_tokens (user_id, refresh_token) VALUES ($1, $2)', [userInfo.userId, refreshTokenHash]);

    const user: User = {
        userId: userInfo.userId,
        email: userInfo.email,
        emailVerified: userInfo.emailVerified,
    };

    const totpUri = authenticator.generateTotpUri(twoFactorKey, request.email, 'To-Do App', 'SHA1', 6, 30);

    const response: RegisterResponse = {
        user,
        totpUri,
    };

    const jwtContents: JwtContents = {
        user,
        roles: await fetchRoles(user.userId),
    };

    return {
        response,
        jwtContents,
        refreshToken,
    };
};
