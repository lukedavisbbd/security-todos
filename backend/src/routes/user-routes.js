import { Router } from 'express';
import { addUserRole, deleteUserRole, fetchUserRoles, searchUsers, changePassword, clearAllRefreshTokens } from '../db/user-queries.js';
import { UserSearchQuerySchema } from '../models/queries.js';
import { AddRoleRequestSchema, AppError, ChangePasswordRequestSchema } from 'common';
import { fetchRoles } from '../db/role-queries.js';
import { validate } from '../utils/validation.js';
import { authenticated } from '../middleware/auth-middleware.js';

const router = Router();

router.get('/users', async (req, res) => {
    const query = UserSearchQuerySchema.parse(req.query);
    const users = await searchUsers(query.search?.trim());
    res.json(users);
});

router.post('/users/:userId/roles', async (req, res) => {
    const { role } = validate(AddRoleRequestSchema, req.body);
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
    const { role } = validate(AddRoleRequestSchema, req.body);
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

router.put('/users/profile/change-password', authenticated, async (req, res) => {
    const body = validate(ChangePasswordRequestSchema, req.body);

    const authedReq = /** @type {import('../').AuthenticatedRequest} */(req);
    const userId = authedReq.jwtContents.user.userId;

    const ok = await changePassword(userId, body);
    if (!ok) {
        throw new AppError({
            code: 'validation_error',
            status: 400,
            message: 'user or old password is incorrect.',
            data: { errors: ['user or old password is incorrect.'] }
        });
    }

    // await clearAllRefreshTokens(userId);

    res.json({ message: 'Password changed successfully.' });
  }
);

export default router;