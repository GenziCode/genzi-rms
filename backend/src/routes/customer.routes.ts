import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { validate } from '../middleware/validation.middleware';
import { body, param, query } from 'express-validator';

const router = Router();
const customerController = new CustomerController();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(resolveTenant);

/**
 * Validation rules
 */
const createCustomerValidation = [
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

const updateCustomerValidation = [
  param('id').isMongoId().withMessage('Invalid customer ID'),
  ...createCustomerValidation.map(v => v.optional()),
];

const customerIdValidation = [
  param('id').isMongoId().withMessage('Invalid customer ID'),
];

const getCustomersValidation = [
  query('search').optional().trim(),
  query('loyaltyTier')
    .optional()
    .isIn(['bronze', 'silver', 'gold', 'platinum'])
    .withMessage('Invalid loyalty tier'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
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

const adjustPointsValidation = [
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

const getPurchaseHistoryValidation = [
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

/**
 * Routes
 */

// POST /api/customers - Create customer
router.post(
  '/',
  createCustomerValidation,
  validate,
  customerController.createCustomer
);

// GET /api/customers - Get all customers
router.get(
  '/',
  getCustomersValidation,
  validate,
  customerController.getCustomers
);

// GET /api/customers/:id - Get customer by ID
router.get(
  '/:id',
  customerIdValidation,
  validate,
  customerController.getCustomerById
);

// PUT /api/customers/:id - Update customer
router.put(
  '/:id',
  updateCustomerValidation,
  validate,
  customerController.updateCustomer
);

// DELETE /api/customers/:id - Delete customer
router.delete(
  '/:id',
  customerIdValidation,
  validate,
  customerController.deleteCustomer
);

// GET /api/customers/:id/history - Get purchase history
router.get(
  '/:id/history',
  getPurchaseHistoryValidation,
  validate,
  customerController.getPurchaseHistory
);

// POST /api/customers/:id/points - Adjust loyalty points
router.post(
  '/:id/points',
  adjustPointsValidation,
  validate,
  customerController.adjustLoyaltyPoints
);

export default router;

