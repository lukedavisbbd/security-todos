import { Request, Response } from 'express';
import { AppError, LoginRequest, RegisterRequest } from 'common';
import { Router } from 'express';
import { clearRefreshTokens, loginUser, registerUser } from '../db/user-queries';
import { authenticated, setAuthCookies } from '../middleware/auth-middleware';
import config from '../config/config';

const router = Router();

router.post('/login', async (req, res) => {
    const loginReq = LoginRequest.parse(req.body);
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
    const registerReq = RegisterRequest.parse(req.body);
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

router.get('/logout', authenticated, async (req: Request, res: Response) => {
    if ('all' in req.query) {
        clearRefreshTokens(req.jwtContents!.user.userId);
    }

    res.clearCookie(config.jwtCookie);
    res.clearCookie(config.refreshCookie);

    res.send({
        message: 'success',
    });
});

router.post('/whoami', authenticated, async (req: Request, res: Response) => {
    res.send(req.jwtContents);
});

export default router;
