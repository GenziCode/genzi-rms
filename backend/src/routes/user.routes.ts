import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { validate } from '../middleware/validation.middleware';
import { body, param, query } from 'express-validator';

const router = Router();
const userController = new UserController();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(resolveTenant);

/**
 * Validation rules
 */
const createUserValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['owner', 'admin', 'manager', 'cashier', 'kitchen_staff', 'waiter'])
    .withMessage('Invalid role'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .withMessage('Invalid phone format'),
];

const updateUserValidation = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('phone').optional().trim(),
  body('avatar').optional().trim(),
  body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
];

const updateRoleValidation = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['owner', 'admin', 'manager', 'cashier', 'kitchen_staff', 'waiter'])
    .withMessage('Invalid role'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array'),
];

const resetPasswordValidation = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
];

const userIdValidation = [param('id').isMongoId().withMessage('Invalid user ID')];

const getUsersValidation = [
  query('role')
    .optional()
    .isIn(['owner', 'admin', 'manager', 'cashier', 'kitchen_staff', 'waiter'])
    .withMessage('Invalid role'),
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Invalid status'),
  query('search').optional().trim(),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

/**
 * Routes
 */

// POST /api/users - Create user
router.post('/', createUserValidation, validate, userController.createUser);

// GET /api/users - Get all users
router.get('/', getUsersValidation, validate, userController.getUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', userIdValidation, validate, userController.getUserById);

// PUT /api/users/:id - Update user
router.put('/:id', updateUserValidation, validate, userController.updateUser);

// PUT /api/users/:id/role - Update user role
router.put('/:id/role', updateRoleValidation, validate, userController.updateUserRole);

// DELETE /api/users/:id - Delete user
router.delete('/:id', userIdValidation, validate, userController.deleteUser);

// POST /api/users/:id/reset-password - Reset password
router.post('/:id/reset-password', resetPasswordValidation, validate, userController.resetPassword);

export default router;
