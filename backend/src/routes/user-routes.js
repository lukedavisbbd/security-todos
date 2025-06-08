import { Router } from 'express';
import {  addUserRole, deleteUserRole, fetchUserRoles, searchUsers } from '../db/user-queries.js';
import {  RoleRequestSchema, UserSearchQuerySchema } from '../models/queries.js';
import { AppError } from 'common';
import { fetchRoles } from '../db/role-queries.js';

const router = Router();

router.get('/users', async (req, res) => {
    const query = UserSearchQuerySchema.parse(req.query);
    const users = await searchUsers(query.search?.trim());
    res.json(users);
});

router.post('/users/:userId/roles', async (req, res) => {
    const { role } = RoleRequestSchema.parse({ role: req.body.role });
    const userId = parseInt(req.params.userId);

    if (!isFinite(userId)) {
        throw new AppError({
            code: 'validation_error',
            status: 400,
            message: 'Invalid user ID.',
            data: {
                errors: [],
                properties: {
                    role: {
                        errors: ['Invalid user ID.']
                    }
                }
            }
        });
    }

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

router.delete('/users/:userId/roles', async (req, res) => {
    const { role } = RoleRequestSchema.parse({ role: req.body.role });
    const userId = parseInt(req.params.userId);

    if (!isFinite(userId)) {
        throw new AppError({
            code: 'validation_error',
            status: 400,
            message: 'Invalid user ID.',
            data: {
                errors: [],
                properties: {
                    role: {
                        errors: ['Invalid user ID.']
                    }
                }
            }
        });
    }

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