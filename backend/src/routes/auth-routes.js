import { AppError, LoginRequestSchema, RegisterRequestSchema } from 'common';
import { Router } from 'express';
import { clearAllRefreshTokens, deleteRefreshToken, loginUser, registerUser } from '../db/user-queries.js';
import { authenticated, setAuthCookies } from '../middleware/auth-middleware.js';
import config from '../config/config.js';

const router = Router();

router.post('/login', async (req, res) => {
    const loginReq = LoginRequestSchema.parse(req.body);
    const loginDetails = await loginUser(loginReq);

    if (loginDetails) {
        setAuthCookies(res, loginDetails.jwtContents, loginDetails.refreshToken);
        res.json(loginDetails.user);
    } else {
        throw new AppError({
            code: 'validation_error',
            status: 400,
            message: 'Validation Error',
            data: {
                errors: [
                    'Incorrect email or password.'
                ]
            },
        });
    }
});

router.post('/register', async (req, res) => {
    const registerReq = RegisterRequestSchema.parse(req.body);
    const registerDetail = await registerUser(registerReq);

    if (registerDetail) {
        setAuthCookies(res, registerDetail.jwtContents, registerDetail.refreshToken);
        res.json(registerDetail.response);
    } else {
        throw new AppError({
            code: 'validation_error',
            status: 400,
            message: 'Validation Error',
            data: {
                errors: [
                    'Failed to register user.'
                ]
            },
        });
    }
});

/**
 * @param {import('src').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
const logout = async (req, res) => {
    if ('all' in req.query) {
        clearAllRefreshTokens(req.jwtContents.user.userId);
    } else {
        const refreshToken = req.cookies[config.refreshCookie];
        if (typeof refreshToken === 'string' && refreshToken) {
            deleteRefreshToken(req.jwtContents.user.userId, refreshToken);
        }
    }

    res.clearCookie(config.jwtCookie);
    res.clearCookie(config.refreshCookie);

    res.send({
        message: 'success',
    });
};

// @ts-ignore
router.get('/logout', authenticated, logout);

/**
 * @param {import('src').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
const whoami = async (req, res) => {
    res.send(req.jwtContents);
};

// @ts-ignore
router.get('/whoami', authenticated, whoami);

export default router;
