import { body, param, query } from 'express-validator';

/**
 * Create Customer Validations
 */
export const createCustomerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Name must be between 2 and 200 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .withMessage('Invalid phone number format'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('creditLimit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Credit limit must be positive'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
];

/**
 * Update Customer Validations
 */
export const updateCustomerValidation = [
  param('id').isMongoId().withMessage('Invalid customer ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Name must be between 2 and 200 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .withMessage('Invalid phone number format'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('creditLimit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Credit limit must be positive'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
];

/**
 * Customer ID Parameter Validation
 */
export const customerIdParamValidation = [param('id').isMongoId().withMessage('Invalid customer ID')];

/**
 * Get Customers Query Validations
 */
export const getCustomersValidation = [
  query('search').optional().trim(),
  query('loyaltyTier')
    .optional()
    .isIn(['bronze', 'silver', 'gold', 'platinum'])
    .withMessage('Invalid loyalty tier'),
  query('isActive')
    .optional()
    .isIn(['true', 'false', '1', '0'])
    .withMessage('isActive must be a boolean value'),
  query('sortBy')
    .optional()
    .isIn(['name', 'totalSpent', 'totalPurchases', 'createdAt', 'lastPurchase'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

/**
 * Adjust Customer Points Validations
 */
export const adjustPointsValidation = [
  param('id').isMongoId().withMessage('Invalid customer ID'),
  body('points')
    .notEmpty()
    .withMessage('Points value is required')
    .isInt()
    .withMessage('Points must be an integer'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Reason must be between 5 and 200 characters'),
];

/**
 * Get Purchase History Validations
 */
export const getPurchaseHistoryValidation = [
  param('id').isMongoId().withMessage('Invalid customer ID'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

