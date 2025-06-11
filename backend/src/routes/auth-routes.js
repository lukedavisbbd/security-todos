import { AppError, LoginRequestSchema, rateLimitResponse, RegisterRequestSchema, ResetPasswordRequestSchema } from 'common';
import { Router } from 'express';
import { clearAllRefreshTokens, deleteRefreshToken, insertPasswordResetToken, loginUser, registerUser, resetPassword } from '../db/user-queries.js';
import { authenticated, requireRole, setAuthCookies } from '../middleware/auth-middleware.js';
import config from '../config/config.js';
import { validate } from '../utils/validation.js';
import z from 'zod/v4';
import rateLimit from 'express-rate-limit';

const router = Router();

// strict rate limiting on auth routes
// 10 requests / minute
router.use(rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    message: rateLimitResponse('in one minute'),
}));

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

router.get('/password/reset/:userId', requireRole('access_admin'), async (req, res) => {
    const userId = validate(z.coerce.number().int(), req.params.userId);
    const resetToken = await insertPasswordResetToken(userId);
    res.json(resetToken);
});

router.post('/password/reset/:userId', async (req, res) => {
    const request = validate(ResetPasswordRequestSchema, req.body);
    const userId = validate(z.coerce.number().int(), req.params.userId);
    const success = await resetPassword(userId, request);
    
    if (!success) {
        throw new AppError({
            code: 'validation_error',
            status: 400,
            message: 'Reset token has expired or is invalid.',
            data: {
                errors: [
                    'Reset token has expired or is invalid.'
                ]
            },
        });
    }

    res.clearCookie(config.jwtCookie);
    res.clearCookie(config.refreshCookie);

    res.status(204).send();
});

export default router;
