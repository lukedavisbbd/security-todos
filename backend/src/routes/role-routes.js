import { Router } from 'express';
import { requireRole } from '../middleware/auth-middleware.js';
import { fetchRoles } from '../db/role-queries.js';

const router = Router();

router.get('/roles', requireRole('access_admin'), async (_req, res) => {
    const roles = await fetchRoles();
    res.json(roles);
});

export default router;
