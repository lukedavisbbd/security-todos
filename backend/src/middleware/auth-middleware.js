import config from '../config/config.js';
import jsonwebtoken from 'jsonwebtoken';
import { loginWithToken } from '../db/user-queries.js';
import { AppError, JwtContentsSchema } from 'common';

/**
 * @param {import('express').Response} res 
 * @param {import('common').JwtContents} jwtContents 
 * @param {string} refreshToken 
 */
export const setAuthCookies = (res, jwtContents, refreshToken) => {
    const jwt = jsonwebtoken.sign(jwtContents, config.jwtSecret, {
        algorithm: 'HS256',
        expiresIn: '1 minutes',
    });

    const future85days = new Date();
    future85days.setDate(future85days.getDate() + 85);

    res.cookie(config.jwtCookie, jwt, { httpOnly: true, secure: true, expires: future85days });
    res.cookie(config.refreshCookie, refreshToken, { httpOnly: true, secure: true, expires: future85days });
};

/**
 * @param {(import('express').Request & {
 *     jwtContents?: import('common').JwtContents & ({ iat: number, exp: number } | {})
 * })} req 
 * @param {import('express').Response} res 
 */
const authenticateByJwt = async (req, res) => {
    const jwtCookie = req.cookies[config.jwtCookie];
    
    if (typeof jwtCookie === 'string') {
        try {
            const jwt = /** @type {import('common').JwtContents & { iat: number, exp: number }} */(
                jsonwebtoken.verify(jwtCookie, config.jwtSecret)
            );
            req.jwtContents = jwt;
            return;
        } catch (error) {
            // if we failed to login, attempt to refresh the jwt
            try {
                const jwt = JwtContentsSchema.parse(jsonwebtoken.decode(jwtCookie));
                /**
                 * @type {unknown}
                 */
                const refreshToken = req.cookies[config.refreshCookie];
                if (typeof refreshToken === 'string' && refreshToken) {
                    const loginResult = await loginWithToken(jwt.user.userId, refreshToken)
                    if (loginResult) {
                        const { jwtContents, newToken } = loginResult;
                        setAuthCookies(res, jwtContents, newToken);
                        req.jwtContents = jwtContents;
                        return;
                    }
                }
            } catch {
                // logout on error
            }
        }
    }

    res.clearCookie(config.jwtCookie);
    res.clearCookie(config.refreshCookie);
    
    throw new AppError({
        code: 'not_logged_in',
        status: 401,
        message: 'Not logged in.',
        data: undefined,
    });
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const authenticated = async (req, res, next) => {
    await authenticateByJwt(req, res);
    next();
};

/**
 * @param {string} roleRequirement 
 */
export const requireRole = (roleRequirement) => {
    /**
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     * @param {import('express').NextFunction} next 
     */
    const middleware = async (req, res, next) => {
        await authenticateByJwt(req, res);

        // assert that authenticateByJwt has turned req into an AuthenticatedRequest
        const authReq = /** @type {import('src/index.js').AuthenticatedRequest} */(req);
        
        if (!authReq.jwtContents.roles.includes(roleRequirement)) {
            throw new AppError({
                code: 'missing_role',
                status: 401,
                message: 'Not allowed.',
                data: undefined,
            });
        }
        
        next();
    };
    return middleware;
};