import { pool } from './pool.js';
import crypto from 'crypto';
import pg from 'pg';
import bcrypt from 'bcrypt';
import authenticator from 'authenticator';
import config from '../config/config.js';
import { AppError } from 'common';

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

const generateRefreshToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * @param {any} row
 */
const mapRowToUserInfo = (row) => {
    if (!row)
        return null;

    /** @type {number | undefined} */
    const userId = row.user_id;
    /** @type {string | undefined} */
    const passwordHash = row.password;
    /** @type {string | undefined} */
    const email = row.email;
    /** @type {string | undefined} */
    const name = row.name;
    /** @type {boolean | undefined} */
    const emailVerified = row.email_verified;
    /** @type {string | undefined} */
    const twoFactorKeyEncrypted = row.two_factor_key;
    /** @type {string | null} */
    const refreshTokenHash = row.refresh_token;

    if (!userId || !passwordHash || !email || !name || typeof emailVerified === 'undefined' || !twoFactorKeyEncrypted) {
        console.error(`failed to map row to user ${userId}`, row);
        throw new AppError();
    }

    return {
        userId,
        passwordHash,
        email,
        name,
        emailVerified,
        twoFactorKeyEncrypted,
        refreshTokenHash,
    };
};

/**
 * @param {string | undefined} search
 * @returns {Promise<import('common').UserWithRoles[]>}
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
            existing.roles.push(row.role_name);
        } else {
            users.push({
                user: {
                    userId: row.user_id,
                    name: row.name,
                    email: row.email,
                    emailVerified: row.email_verified,
                },
                roles: row.role_name ? [row.role_name] : [],
            })
        }
    });
    
    return users;
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

    const newToken = generateRefreshToken();
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

    if (!userInfo) {
        console.error('failed to add user');
        throw new AppError();
    }

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = await bcrypt.hash(refreshToken, saltRounds);
    await pool.query('INSERT INTO refresh_tokens (user_id, refresh_token) VALUES ($1, $2)', [userInfo.userId, refreshTokenHash]);

    const totpUri = authenticator.generateTotpUri(twoFactorKey, request.email, 'To-Do App', 'SHA1', 6, 30);

    return totpUri;
};

/**
 * Get a user record (user_id, email) by its numeric ID.
 * @param {number} userId
 * @returns {Promise<{ user_id: number, email: string } | null>}
 */
export async function getUserById(userId) {
  const result = await pool.query(
    `SELECT user_id, email
     FROM users
     WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}
