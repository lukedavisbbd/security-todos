import { Router } from 'express';
import authRoutes from './auth-routes';

const router = Router();

router.get('/', (_req, res) => {
    res.json({
        'message': 'Hello, world!',
    });
});

router.use('/auth', authRoutes);

export default router;
