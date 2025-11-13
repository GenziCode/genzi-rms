import { body, param, query } from 'express-validator';

/**
 * Create User Validations
 */
export const createUserValidation = [
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

/**
 * Update User Validations
 */
export const updateUserValidation = [
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
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Invalid status'),
];

/**
 * Update User Role Validations
 */
export const updateRoleValidation = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['owner', 'admin', 'manager', 'cashier', 'kitchen_staff', 'waiter'])
    .withMessage('Invalid role'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array'),
];

/**
 * Reset User Password Validations
 */
export const resetUserPasswordValidation = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
];

/**
 * User ID Parameter Validation
 */
export const userIdParamValidation = [param('id').isMongoId().withMessage('Invalid user ID')];

/**
 * Get Users Query Validations
 */
export const getUsersValidation = [
  query('role')
    .optional()
    .isIn(['owner', 'admin', 'manager', 'cashier', 'kitchen_staff', 'waiter'])
    .withMessage('Invalid role'),
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Invalid status'),
  query('search').optional().trim().isLength({ max: 100 }),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];

