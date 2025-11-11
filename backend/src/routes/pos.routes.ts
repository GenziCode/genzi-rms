import { Router } from 'express';
import { POSController } from '../controllers/pos.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { validate } from '../middleware/validation.middleware';
import { body, param, query } from 'express-validator';

const router = Router();
const posController = new POSController();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(resolveTenant);

/**
 * Validation rules
 */
const createSaleValidation = [
  body('storeId')
    .notEmpty()
    .withMessage('Store ID is required')
    .isMongoId()
    .withMessage('Invalid store ID'),
  body('customerId')
    .optional()
    .isMongoId()
    .withMessage('Invalid customer ID'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('items.*.quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('items.*.price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be positive'),
  body('items.*.discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount must be positive'),
  body('items.*.discountType')
    .optional()
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be percentage or fixed'),
  body('discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount must be positive'),
  body('discountType')
    .optional()
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be percentage or fixed'),
  body('payments')
    .isArray({ min: 1 })
    .withMessage('At least one payment method is required'),
  body('payments.*.method')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['cash', 'card', 'mobile', 'bank', 'other'])
    .withMessage('Invalid payment method'),
  body('payments.*.amount')
    .notEmpty()
    .withMessage('Payment amount is required')
    .isFloat({ min: 0 })
    .withMessage('Payment amount must be positive'),
  body('payments.*.reference')
    .optional()
    .trim(),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

const holdTransactionValidation = [
  body('storeId')
    .notEmpty()
    .withMessage('Store ID is required')
    .isMongoId()
    .withMessage('Invalid store ID'),
  body('customerId')
    .optional()
    .isMongoId()
    .withMessage('Invalid customer ID'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('items.*.quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
];

const resumeTransactionValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid sale ID'),
  body('payments')
    .isArray({ min: 1 })
    .withMessage('At least one payment method is required'),
  body('payments.*.method')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['cash', 'card', 'mobile', 'bank', 'other'])
    .withMessage('Invalid payment method'),
  body('payments.*.amount')
    .notEmpty()
    .withMessage('Payment amount is required')
    .isFloat({ min: 0 })
    .withMessage('Payment amount must be positive'),
];

const voidSaleValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid sale ID'),
  body('reason')
    .notEmpty()
    .withMessage('Void reason is required')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters'),
];

const refundSaleValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid sale ID'),
  body('amount')
    .notEmpty()
    .withMessage('Refund amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Refund amount must be greater than 0'),
  body('reason')
    .notEmpty()
    .withMessage('Refund reason is required')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters'),
];

const getSalesValidation = [
  query('storeId')
    .optional()
    .isMongoId()
    .withMessage('Invalid store ID'),
  query('cashierId')
    .optional()
    .isMongoId()
    .withMessage('Invalid cashier ID'),
  query('customerId')
    .optional()
    .isMongoId()
    .withMessage('Invalid customer ID'),
  query('status')
    .optional()
    .isIn(['completed', 'held', 'voided', 'refunded', 'partial_refund'])
    .withMessage('Invalid status'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

const saleIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid sale ID'),
];

const dailySummaryValidation = [
  query('storeId')
    .optional()
    .isMongoId()
    .withMessage('Invalid store ID'),
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
];

/**
 * Routes
 */

// GET /api/sales/daily-summary - Get daily summary (must be before /:id)
router.get(
  '/daily-summary',
  dailySummaryValidation,
  validate,
  posController.getDailySummary
);

// POST /api/sales/hold - Hold transaction (must be before /:id)
router.post(
  '/hold',
  holdTransactionValidation,
  validate,
  posController.holdTransaction
);

// GET /api/sales/hold - Get held transactions (must be before /:id)
router.get(
  '/hold',
  posController.getHeldTransactions
);

// POST /api/sales/resume/:id - Resume held transaction
router.post(
  '/resume/:id',
  resumeTransactionValidation,
  validate,
  posController.resumeTransaction
);

// POST /api/sales - Create sale
router.post(
  '/',
  createSaleValidation,
  validate,
  posController.createSale
);

// GET /api/sales - Get all sales
router.get(
  '/',
  getSalesValidation,
  validate,
  posController.getSales
);

// GET /api/sales/:id - Get sale by ID
router.get(
  '/:id',
  saleIdValidation,
  validate,
  posController.getSaleById
);

// POST /api/sales/:id/void - Void sale
router.post(
  '/:id/void',
  voidSaleValidation,
  validate,
  posController.voidSale
);

// POST /api/sales/:id/refund - Refund sale
router.post(
  '/:id/refund',
  refundSaleValidation,
  validate,
  posController.refundSale
);

export default router;

