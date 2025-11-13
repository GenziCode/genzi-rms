import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { paymentController } from '../controllers/payment.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { isValidMongoId } from '../utils/validators';
import { auditMiddleware } from '../middleware/audit.middleware';

const router = Router();

// Apply authentication and tenant resolution to most routes
// Webhook route is exempt

/**
 * POST /api/payments/intent
 * Create payment intent
 */
router.post(
  '/intent',
  authenticate,
  resolveTenant,
  [
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0'),
    
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
    
    body('description')
      .optional()
      .trim(),
    
    validate,
  ],
  auditMiddleware({
    action: 'create',
    entityType: 'payment',
    resolveEntityId: ({ responseBody }) => responseBody?.data?.paymentId,
    metadataBuilder: ({ req }) => ({
      stage: 'intent',
      amount: req.body?.amount,
      currency: req.body?.currency,
    }),
  }),
  paymentController.createIntent
);

/**
 * POST /api/payments/confirm
 * Confirm payment
 */
router.post(
  '/confirm',
  authenticate,
  resolveTenant,
  [
    body('paymentIntentId')
      .trim()
      .notEmpty()
      .withMessage('Payment intent ID is required'),
    
    validate,
  ],
  auditMiddleware({
    action: 'update',
    entityType: 'payment',
    resolveEntityId: ({ req, responseBody }) =>
      responseBody?.data?.payment?._id ||
      responseBody?.data?.paymentId ||
      req.body?.paymentId ||
      undefined,
    metadataBuilder: ({ req }) => ({
      stage: 'confirm',
      paymentIntentId: req.body?.paymentIntentId,
    }),
  }),
  paymentController.confirmPayment
);

/**
 * GET /api/payments
 * Get all payments
 */
router.get(
  '/',
  authenticate,
  resolveTenant,
  [
    query('status')
      .optional()
      .isIn(['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'])
      .withMessage('Invalid status'),
    
    query('method')
      .optional()
      .isIn(['cash', 'card', 'mobile', 'bank', 'cheque', 'credit'])
      .withMessage('Invalid payment method'),
    
    query('customerId')
      .optional()
      .custom((value) => {
        if (value && !isValidMongoId(value)) {
          throw new Error('Invalid customer ID');
        }
        return true;
      }),
    
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    validate,
  ],
  paymentController.getAll
);

/**
 * GET /api/payments/:id
 * Get payment by ID
 */
router.get(
  '/:id',
  authenticate,
  resolveTenant,
  [
    param('id')
      .custom((value) => {
        if (!isValidMongoId(value)) {
          throw new Error('Invalid payment ID');
        }
        return true;
      }),
    validate,
  ],
  paymentController.getById
);

/**
 * POST /api/payments/:id/refund
 * Process refund
 */
router.post(
  '/:id/refund',
  authenticate,
  resolveTenant,
  [
    param('id')
      .custom((value) => {
        if (!isValidMongoId(value)) {
          throw new Error('Invalid payment ID');
        }
        return true;
      }),
    
    body('amount')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0'),
    
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Reason must be 500 characters or less'),
    
    validate,
  ],
  auditMiddleware({
    action: 'update',
    entityType: 'payment',
    resolveEntityId: ({ req }) => req.params.id,
    metadataBuilder: ({ req }) => ({
      stage: 'refund',
      amount: req.body?.amount,
      reason: req.body?.reason,
    }),
  }),
  paymentController.refund
);

/**
 * POST /api/payments/test-stripe
 * Test Stripe connection
 */
router.post(
  '/test-stripe',
  authenticate,
  resolveTenant,
  paymentController.testStripe
);

export default router;

