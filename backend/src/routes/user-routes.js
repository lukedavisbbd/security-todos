import { Router } from 'express';
import {  searchUsers } from '../db/user-queries.js';
import {  UserSearchQuerySchema } from '../models/queries.js';

const router = Router();

router.get('/users', async (req, res) => {
    const query = UserSearchQuerySchema.parse(req.query);
    const users = await searchUsers(query.search?.trim());
    res.json(users);
});

export default router;