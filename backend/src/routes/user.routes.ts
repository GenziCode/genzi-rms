import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createUserValidation,
  updateUserValidation,
  updateRoleValidation,
  resetUserPasswordValidation,
  userIdParamValidation,
  getUsersValidation,
} from '../validations/user.validations';

const router = Router();
const userController = new UserController();

// All routes require authentication
// Note: resolveTenant is already applied in routes/index.ts
router.use(authenticate);

/**
 * Routes
 */

// POST /api/users - Create user
router.post('/', [...createUserValidation, validate], userController.createUser);

// GET /api/users - Get all users
router.get('/', [...getUsersValidation, validate], userController.getUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', [...userIdParamValidation, validate], userController.getUserById);

// PUT /api/users/:id - Update user
router.put('/:id', [...updateUserValidation, validate], userController.updateUser);

// PUT /api/users/:id/role - Update user role
router.put('/:id/role', [...updateRoleValidation, validate], userController.updateUserRole);

// DELETE /api/users/:id - Delete user
router.delete('/:id', [...userIdParamValidation, validate], userController.deleteUser);

// POST /api/users/:id/reset-password - Reset password
router.post(
  '/:id/reset-password',
  [...resetUserPasswordValidation, validate],
  userController.resetPassword
);

export default router;
