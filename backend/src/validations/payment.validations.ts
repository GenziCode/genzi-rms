import { body, param, query } from 'express-validator';
import { isValidMongoId } from '../utils/validators';

/**
 * Payment Statuses
 */
const PAYMENT_STATUSES = [
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded',
  'partially_refunded',
];

/**
 * Payment Methods
 */
const PAYMENT_METHODS = ['cash', 'card', 'mobile', 'bank', 'cheque', 'credit'];

/**
 * Create Payment Intent Validations
 */
export const createPaymentIntentValidation = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be 3-letter code (e.g., USD)'),
  body('invoiceId')
    .optional()
    .custom((value) => {
      if (value && !isValidMongoId(value)) {
        throw new Error('Invalid invoice ID');
      }
      return true;
    }),
  body('customerId')
    .optional()
    .custom((value) => {
      if (value && !isValidMongoId(value)) {
        throw new Error('Invalid customer ID');
      }
      return true;
    }),
  body('description').optional().trim(),
];

/**
 * Confirm Payment Validations
 */
export const confirmPaymentValidation = [
  body('paymentIntentId').trim().notEmpty().withMessage('Payment intent ID is required'),
];

/**
 * Get Payments Query Validations
 */
export const getPaymentsValidation = [
  query('status').optional().isIn(PAYMENT_STATUSES).withMessage('Invalid status'),
  query('method').optional().isIn(PAYMENT_METHODS).withMessage('Invalid payment method'),
  query('customerId')
    .optional()
    .custom((value) => {
      if (value && !isValidMongoId(value)) {
        throw new Error('Invalid customer ID');
      }
      return true;
    }),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];

/**
 * Payment ID Parameter Validation
 */
export const paymentIdParamValidation = [
  param('id').custom((value) => {
    if (!isValidMongoId(value)) {
      throw new Error('Invalid payment ID');
    }
    return true;
  }),
];

/**
 * Process Refund Validations
 */
export const processRefundValidation = [
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must be 500 characters or less'),
];

