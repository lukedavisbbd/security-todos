import { Router } from 'express';
import { requireRole } from '../middleware/auth-middleware.js';
import { searchUsers } from '../db/user-queries.js';
import { UserSearchQuerySchema } from '../models/queries.js';

const router = Router().use(requireRole('access_admin'));

router.get('/users/search', async (req, res) => {
    const query = UserSearchQuerySchema.parse(req.query);
    
    const users = await searchUsers(query.search);

    res.json(users);
});

export default router;
