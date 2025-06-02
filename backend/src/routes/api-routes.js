import { Router } from 'express';
import authRoutes from './auth-routes.js';
import taskRoutes from './task-routes.js';
import teamRoutes from './team-routes.js';
import adminRoutes from './admin-routes.js';

const router = Router();

router.get('/', (_req, res) => {
    res.json({
        'message': 'Hello, world!',
    });
});

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/teams', teamRoutes);
router.use('/admin', adminRoutes);

export default router;
