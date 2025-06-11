import { Router } from 'express';
import { addUserRole, deleteUserRole, fetchUserRoles, getUserById, searchUsers, searchUsersPublic } from '../db/user-queries.js';
import { UserSearchQuerySchema } from '../models/queries.js';
import { AddRoleRequestSchema, AppError } from 'common';
import { authenticated } from '../middleware/auth-middleware.js';
import { fetchRoles } from '../db/role-queries.js';
import { validate } from '../utils/validation.js';
import { requireRole } from '../middleware/auth-middleware.js';
import crypto from 'crypto';
import z from 'zod/v4';

const router = Router();

router.get('/users', authenticated, async (req, res) => {
    const query = validate(UserSearchQuerySchema, req.query);
    const users = await searchUsersPublic(query.search?.trim());
    res.json(users);
});

router.get('/users/full', requireRole('access_admin'), async (req, res) => {
    const query = validate(UserSearchQuerySchema, req.query);
    const users = await searchUsers(query.search?.trim());
    res.json(users);
});

router.get('/users/:userId/picture', async (req, res) => {
    const userId = validate(z.coerce.number().int(), req.params.userId);

    const user = await getUserById(userId);
    
    if (!user) {
        throw new AppError({
            code: 'not_found',
            status: 404,
            message: 'User not found',
            data: undefined,
        });
    }

    const hash = crypto.createHash('sha256')
        .update(user.email.trim().toLowerCase())
        .digest('hex');
    
    res.json(`https://gravatar.com/avatar/${hash}?d=identicon&s=256`);
});

router.post('/users/:userId/roles', requireRole('access_admin'), async (req, res) => {
    const { role } = validate(AddRoleRequestSchema, req.body);
    const userId = validate(z.coerce.number().int(), req.params.userId);

    const roles = await fetchRoles();
    
    if (!roles.includes(role)) {
        throw new AppError({
            code: 'validation_error',
            status: 400,
            message: 'Role not found.',
            data: {
                errors: [],
                properties: {
                    role: {
                        errors: ['Role not found.']
                    }
                }
            }
        });
    }

    await addUserRole(userId, role);

    const userRoles = await fetchUserRoles(userId);
    
    res.json(userRoles);
});

router.delete('/users/:userId/roles', requireRole('access_admin'), async (req, res) => {
    const { role } = validate(AddRoleRequestSchema, req.body);
    const userId = validate(z.coerce.number().int(), req.params.userId);

    const roles = await fetchRoles();
    
    if (!roles.includes(role)) {
        throw new AppError({
            code: 'validation_error',
            status: 400,
            message: 'Role not found.',
            data: {
                errors: [],
                properties: {
                    role: {
                        errors: ['Role not found.']
                    }
                }
            }
        });
    }

    await deleteUserRole(userId, role);

    const userRoles = await fetchUserRoles(userId);
    
    res.json(userRoles);
});

export default router;