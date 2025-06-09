import { AppError, LoginRequestSchema, RegisterRequestSchema } from 'common';
import { Router } from 'express';
import { clearAllRefreshTokens, deleteRefreshToken, loginUser, registerUser } from '../db/user-queries.js';
import { authenticated, requireRole, setAuthCookies } from '../middleware/auth-middleware.js';
import config from '../config/config.js';
import { validate } from '../utils/validation.js';
import z from 'zod/v4';

const router = Router();

router.post('/login', async (req, res) => {
    const loginReq = validate(LoginRequestSchema, req.body);
    const loginDetails = await loginUser(loginReq);

    if (loginDetails) {
        setAuthCookies(res, loginDetails.jwtContents, loginDetails.refreshToken);
        res.json(loginDetails.user);
    } else {
        throw new AppError({
            code: 'validation_error',
            status: 400,
            message: 'Incorrect email or password.',
            data: {
                errors: [
                    'Incorrect email or password.'
                ]
            },
        });
    }
});

router.post('/register', async (req, res) => {
    const registerReq = validate(RegisterRequestSchema, req.body);
    const registerDetail = await registerUser(registerReq);

    if (registerDetail) {
        res.json(registerDetail);
    } else {
        throw new AppError({
            code: 'validation_error',
            status: 400,
            message: 'Failed to register user.',
            data: {
                errors: ['Failed to register user.']
            },
        });
    }
});

router.get('/logout', authenticated, async (req, res) => {
    const authedReq = /** @type {import('../').AuthenticatedRequest} */(req);
    
    if ('all' in authedReq.query) {
        await clearAllRefreshTokens(authedReq.jwtContents.user.userId);
    } else {
        const refreshToken = authedReq.cookies[config.refreshCookie];
        if (typeof refreshToken === 'string' && refreshToken) {
            await deleteRefreshToken(authedReq.jwtContents.user.userId, refreshToken);
        }
    }

    res.clearCookie(config.jwtCookie);
    res.clearCookie(config.refreshCookie);

    res.send({
        message: 'success',
    });
});

router.get('/logout/:userId', requireRole('access_admin'), async (req, res) => {
    const userId = validate(z.coerce.number().int(), req.params.userId);
    
    await clearAllRefreshTokens(userId);

    res.send({
        message: 'success',
    });
});

router.get('/whoami', authenticated, (req, res) => {
    const authedReq = /** @type {import('../').AuthenticatedRequest} */(req);
    res.send(authedReq.jwtContents);
});

export default router;
