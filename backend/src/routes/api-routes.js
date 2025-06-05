import { Router } from 'express';
import authRoutes from './auth-routes.js';
import accessControlRoutes from './access-control-routes.js';

const router = Router();

router.get('/', (_req, res) => {
    res.json({
        'message': 'Hello, world!',
    });
});

router.use('/auth', authRoutes);
router.use('/access-control', accessControlRoutes);

export default router;
