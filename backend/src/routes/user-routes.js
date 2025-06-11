import { Router } from 'express';
import { addUserRole, deleteUserRole, fetchUserRoles, searchUsers, updateUserName, updateUserEmail } from '../db/user-queries.js';
import { UserSearchQuerySchema } from '../models/queries.js';
import { AddRoleRequestSchema, AppError, UpdateUserNameSchema, UpdateEmailSchema } from 'common';
import { authenticated, setAuthCookies } from '../middleware/auth-middleware.js';
import { fetchRoles } from '../db/role-queries.js';
import { validate } from '../utils/validation.js';
import { requireRole } from '../middleware/auth-middleware.js';
import z from 'zod/v4';

const router = Router();

router.get('/users', requireRole('access_admin'), async (req, res) => {
    const query = UserSearchQuerySchema.parse(req.query);
    const users = await searchUsers(query.search?.trim());
    res.json(users);
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

/**
 * Update user's name
 */
router.put('/users/profile/name', authenticated, async (req, res) => {
    const authedReq = /** @type {import('../').AuthenticatedRequest} */(req);
    const currentUserId = authedReq.jwtContents.user.userId;
    const { name } = validate(UpdateUserNameSchema, req.body);

    await updateUserName(currentUserId, name);
    res.json({ message: 'Name updated successfully' });
});

router.put("/users/profile/email", authenticated, async (req, res, next) => {
  try {
    const authedReq =
      /** @type {import('../index.js').AuthenticatedRequest} */ (req);

    const userId = authedReq.jwtContents.user.userId;
    const { email, twoFactor } = validate(UpdateEmailSchema, req.body);

    const updatedUser = await updateUserEmail(userId, email, twoFactor);

    if (updatedUser) {
      setAuthCookies(res, updatedUser.jwtContents, updatedUser.refreshToken);
      res.json(updatedUser.user);
    }
  } catch (error) {
    next(error);
  }
});

export default router;