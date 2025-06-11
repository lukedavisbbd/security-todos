import { pool } from './pool.js';
import crypto from 'crypto';
import pg from 'pg';
import bcrypt from 'bcrypt';
import authenticator from 'authenticator';
import config from '../config/config.js';
import { AppError, PublicUserSchema, UserSchema, UserWithRolesSchema } from 'common';
import z from 'zod/v4';
import { assignRole } from './admin-queries.js';

const saltRounds = 10;

const encryptionAlgorithm = 'aes-256-gcm';

/**
 * @param {string} text 
 */
const encrypt = async (text) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(encryptionAlgorithm, config.masterKey2fa, iv);
    const encryptedText = cipher.update(text, 'utf8', 'hex');
    
    return iv.toString('hex') + ':' + encryptedText;
}

/**
 * @param {string} text 
 */
const decrypt = async (text) => {
    const [ivString, data] = text.split(':');

    if (!ivString || !data) return undefined;

    const iv = Buffer.from(ivString, 'hex');
    const cipher = crypto.createDecipheriv(encryptionAlgorithm, config.masterKey2fa, iv);
    const textDecrypted = cipher.update(data, 'hex', 'utf8');
    
    return textDecrypted;
}

const generateHexToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

const UserInfoSchema = z.object({
    userId: z.int(),
    passwordHash: z.string().nonempty(),
    email: z.email(),
    name: z.string().nonempty(),
    emailVerified: z.boolean(),
    twoFactorKeyEncrypted: z.string().nonempty(),
    refreshTokenHash: z.string().nonempty().optional(),
});

/**
 * @param {any} row
 */
const mapRowToUserInfo = (row) => {
    return UserInfoSchema.parse({
        userId: row.user_id,
        passwordHash: row.password,
        email: row.email,
        name: row.name,
        emailVerified: row.email_verified,
        twoFactorKeyEncrypted: row.two_factor_key,
        refreshTokenHash: row.refresh_token,
    });
};

/**
 * @param {string | undefined} search
 */
export const searchUsers = async (search) => {
    const result = await pool.query(
        `SELECT user_id, email, name, email_verified, role_name FROM users NATURAL LEFT JOIN user_roles NATURAL LEFT JOIN roles
        WHERE name ILIKE '%' || $1 || '%' OR email ILIKE '%' || $1 || '%' LIMIT 100`,
        [search ?? '']
    );

    /** @type {import('common').UserWithRoles[]} */
    const users = [];
    
    result.rows.forEach(row => {
        const existing = users.find(user => user.user.userId == row.user_id);
        if (existing && row.role_name) {
            existing.roles.push(z.string().parse(row.role_name));
        } else {
            users.push(UserWithRolesSchema.parse({
                user: {
                    userId: row.user_id,
                    name: row.name,
                    email: row.email,
                    emailVerified: row.email_verified,
                },
                roles: row.role_name ? [z.string().parse(row.role_name)] : [],
            }));
        }
    });
    
    return users;
};

/**
 * @param {string | undefined} search
 */
export const searchUsersPublic = async (search) => {
    const result = await pool.query(
        `SELECT user_id, name FROM users
        WHERE name ILIKE '%' || $1 || '%' OR email ILIKE '%' || $1 || '%' LIMIT 100`,
        [search ?? '']
    );

    const users = result.rows.map(row => {
        return {
            userId: row.user_id,
            name: row.name,
        };
    });
    
    return PublicUserSchema.array().parse(users);
};

/**
 * @param {number} userId
 */
export const fetchUserRoles = async (userId) => {
    const result = await pool.query('SELECT role_name FROM user_roles NATURAL JOIN roles WHERE user_id = $1 ORDER BY role_name', [userId]);
    return result.rows.map(row => /** @type {string} */ (row.role_name));
};

/**
 * @param {number} userId
 * @param {string} role
 */
export const addUserRole = async (userId, role) => {
    await pool.query('insert into user_roles values ($1, (select role_id from roles where role_name = $2));', [userId, role]);
};

/**
 * @param {number} userId
 * @param {string} role
 */
export const deleteUserRole = async (userId, role) => {
    await pool.query('delete from user_roles where user_id = $1 and role_id in (select role_id from roles where role_name = $2);', [userId, role]);
};

/**
 * @param {number} userId
 */
export const clearAllRefreshTokens = async (userId) => {
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
};

/**
 * @param {number} userId
 * @param {string} refreshToken
 */
export const deleteRefreshToken = async (userId, refreshToken) => {
    const result = await pool.query('SELECT refresh_token FROM refresh_tokens WHERE user_id = $1', [userId]);
    const tokenPromises = result.rows.map(row => /** @type {string} */(row.refresh_token))
        .map(async (tokenHash) => {return {
            tokenHash,
            match: await bcrypt.compare(refreshToken, tokenHash),
        }});
    const token = (await Promise.all(tokenPromises)).filter(({ match }) => match)[0];

    if (token) {
        await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1 AND refresh_token = $2', [userId, token.tokenHash]);
    }
};

/**
 * @param {number} userId
 * @param {string} refreshToken
 */
export const loginWithToken = async (userId, refreshToken) => {
    const result = await pool.query('SELECT user_id, email, name, password, email_verified, two_factor_key, refresh_token FROM users NATURAL JOIN refresh_tokens WHERE user_id = $1 AND expiry > NOW()', [userId]);
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

    // last two checks are just necessary for type checking
    if (!userMatch || !userMatch.userInfo || !userMatch.matches)
        return null;

    // delete old token
    const { userInfo } = userMatch;
    const oldTokenHash = userInfo.refreshTokenHash;
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1 AND refresh_token = $2', [userId, oldTokenHash]);

    const newToken = generateHexToken();
    const newTokenHash = await bcrypt.hash(newToken, saltRounds);
    await pool.query('INSERT INTO refresh_tokens (user_id, refresh_token) VALUES ($1, $2)', [userId, newTokenHash]);

    /**
     * @type {import('common').User}
     */
    const user = {
        userId: userInfo.userId,
        email: userInfo.email,
        name: userInfo.name,
        emailVerified: userInfo.emailVerified,
    };

    /**
     * @type {import('common').JwtContents}
     */
    const jwtContents = {
        user,
        roles: await fetchUserRoles(user.userId),
    };

    return {
        user,
        jwtContents,
        newToken,
    };
};

/**
 * @param {import('common').LoginRequest} request 
 */
export const loginUser = async (request) => {
    const result = await pool.query('SELECT user_id, email, name, password, email_verified, two_factor_key FROM users WHERE email = $1', [request.email]);
    const row = result.rows[0];
    const userInfo = row ? mapRowToUserInfo(row) : null;

    if (!userInfo)
        return null;

    const refreshToken = generateHexToken();
    const refreshTokenHash = await bcrypt.hash(refreshToken, saltRounds);
    await pool.query('INSERT INTO refresh_tokens (user_id, refresh_token) VALUES ($1, $2)', [userInfo.userId, refreshTokenHash]);

    const twoFactorKey = await decrypt(userInfo.twoFactorKeyEncrypted);

    if (!twoFactorKey) {
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
    
    /**
     * @type {import('common').User}
     */
    const user = {
        userId: userInfo.userId,
        email: userInfo.email,
        name: userInfo.name,
        emailVerified: userInfo.emailVerified,
    };
    
    /**
     * @type {import('common').JwtContents}
     */
    const jwtContents = {
        user,
        roles: await fetchUserRoles(user.userId),
    };

    return {
        user,
        jwtContents,
        refreshToken,
    };
};

/**
 * @param {import('common').RegisterRequest} request
 */
export const registerUser = async (request) => {
    const twoFactorKey = authenticator.generateKey();
    const twoFactorKeyEncrypted = await encrypt(twoFactorKey);
    const passwordHash = await bcrypt.hash(request.password, saltRounds);
    let userInfo;

    try {
        const result = await pool.query('INSERT INTO users (email, name, password, two_factor_key) VALUES ($1, $2, $3, $4) RETURNING user_id, email, name, password, email_verified, two_factor_key', [request.email, request.name, passwordHash, twoFactorKeyEncrypted]);
        userInfo = mapRowToUserInfo(result.rows[0]);
    } catch (error) {
        if (error instanceof pg.DatabaseError && error.constraint === 'users_email_key') {
            const data = {
                errors: /** @type {string[]} */([]),
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

    // make first user admin
    if (userInfo.userId === 1) {
        await assignRole(userInfo.userId, 'access_admin');
    }

    const totpUri = authenticator.generateTotpUri(twoFactorKey, request.email, 'To-Do App', 'SHA1', 6, 30);

    return totpUri;
};

/**
 * @param {number} userId 
 */
export const insertPasswordResetToken = async (userId) => {
    const resetToken = generateHexToken();
    const resetTokenHash = await bcrypt.hash(resetToken, saltRounds);

    await pool.query('INSERT INTO password_reset_tokens (user_id, reset_token) VALUES ($1, $2)', [userId, resetTokenHash]);

    return resetToken;
}

/**
 * Returns true if successfully changed password,
 * returns false if failed to change password because 'user not found or password is incorrect'.
 * @param {number} userId
 * @param {import('common').ResetPasswordRequest} request
 */
export const resetPassword = async (userId, request) => {
    const userResult = await pool.query(
        'SELECT user_id, email, name, password, email_verified, two_factor_key FROM users WHERE user_id = $1',
        [userId]
    );
    const userRow = userResult.rows[0];
    const userInfo = userRow ? mapRowToUserInfo(userRow) : null;

    if (!userInfo)
        return false;
    
    const resetTokenResult = await pool.query(
        'SELECT reset_token FROM password_reset_tokens WHERE user_id = $1 AND expiry > NOW()',
        [userId]
    );
    const hashedTokens = z.string().array().parse(resetTokenResult.rows.map(row => row.reset_token));

    const twoFactorKey = await decrypt(userInfo.twoFactorKeyEncrypted);

    if (!twoFactorKey) {
        throw new AppError();
    }

    // verify reset token
    const tokenPromises = hashedTokens.map(async (hashedToken) => {
        return {
            hashedToken,
            matches: await bcrypt.compare(request.resetToken, hashedToken),
        };
    });

    const tokenMatch = (await Promise.all(tokenPromises)).find(tm => tm.matches);

    if (!tokenMatch)
        return false;

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

    const { hashedToken } = tokenMatch;
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1 AND reset_token = $2', [userId, hashedToken]);
    
    const newPasswordHash = await bcrypt.hash(request.newPassword, saltRounds);
    await pool.query('UPDATE users SET password = $1 WHERE user_id = $2', [newPasswordHash, userInfo.userId]);

    // logout user
    await clearAllRefreshTokens(userId);

    return true;
};

/**
 * Get a user record (user_id, email) by its numeric ID.
 * @param {number} userId
 */
export const getUserById = async (userId) => {
  const result = await pool.query(
    `SELECT user_id, email, name, email_verified
    FROM users
    WHERE user_id = $1`,
    [userId]
  );

  const row = result.rows[0];
  
  const user = row ? {
    userId: row.user_id,
    email: row.email,
    name: row.name,
    emailVerified: row.email_verified,
  } : null;

  return UserSchema.nullable().parse(user);
}
