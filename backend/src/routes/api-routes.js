import { Router } from 'express';
import authRoutes from './auth-routes.js';
import accessControlRoutes from './access-control-routes.js';
import taskRoutes from './task-routes.js';
import teamRoutes from './team-routes.js';
import statusRoutes from './status-routes.js';
import userRoutes from './user-routes.js';

const router = Router();

router.get('/', (_req, res) => {
    res.json({
        'message': 'Hello, world!',
    });
});

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/teams', teamRoutes);
router.use(statusRoutes);
router.use(userRoutes)
router.use(accessControlRoutes);

export default router;
