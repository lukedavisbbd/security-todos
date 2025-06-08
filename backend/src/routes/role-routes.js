import { Router } from 'express';
import { requireRole } from '../middleware/auth-middleware.js';
import { fetchRoles } from '../db/role-queries.js';

const router = Router().use(requireRole('access_admin'));

router.get('/roles', async (_req, res) => {
    const roles = await fetchRoles();
    res.json(roles);
});

export default router;
