import { AppError, JwtContents } from 'common';
import { Request, Response, NextFunction } from 'express';
import config from '../config/config';
import jsonwebtoken from 'jsonwebtoken';
import { loginWithToken } from '../db/user-queries';

export const setAuthCookies = (res: Response, jwtContents: JwtContents, refreshToken: string) => {
    const jwt = jsonwebtoken.sign(jwtContents, config.jwtSecret, {
        algorithm: 'HS256',
        expiresIn: '1 minutes',
    });

    res.cookie(config.jwtCookie, jwt, { httpOnly: true, secure: true });
    res.cookie(config.refreshCookie, refreshToken, { httpOnly: true, secure: true });
};

const authenticateByJwt = async (req: Request, res: Response) => {
    const jwtCookie = req.cookies[config.jwtCookie] as unknown;
    
    if (typeof jwtCookie === 'string') {
        try {
            const jwt = jsonwebtoken.verify(jwtCookie, config.jwtSecret);
            req.jwtContents = jwt as JwtContents & { iat: number, exp: number };
            return;
        } catch (error) {
            // if we failed to login, attempt to refresh the jwt
            try {
                const jwt = JwtContents.parse(jsonwebtoken.decode(jwtCookie));
                const refreshToken = req.cookies[config.refreshCookie] as unknown;
                if (typeof refreshToken === 'string' && refreshToken) {
                    const loginResult = await loginWithToken(jwt.user.userId, refreshToken)
                    if (loginResult) {
                        const { jwtContents, newToken } = loginResult;
                        setAuthCookies(res, jwtContents, newToken);
                        req.jwtContents = jwtContents as JwtContents;
                        return;
                    }
                }
            } catch {}
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

export const authenticated = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    await authenticateByJwt(req, res);
    next();
};

export const requireRole = (roleRequirement: string) => {
    return async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        await authenticateByJwt(req, res);
        
        if (!req.jwtContents!.roles.includes(roleRequirement)) {
            throw new AppError({
                code: 'missing_role',
                status: 403,
                message: 'Not allowed.',
                data: undefined,
            });
        }
        
        next();
    };
};
