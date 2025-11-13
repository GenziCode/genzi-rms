import { Router } from 'express';
import { body, query, param } from 'express-validator';
import mongoose from 'mongoose';
import { invoiceController } from '../controllers/invoice.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { auditMiddleware } from '../middleware/audit.middleware';

const router = Router();

// Apply authentication and tenant resolution to all routes
router.use(authenticate, resolveTenant);

/**
 * GET /api/invoices
 * Get all invoices with filters
 */
router.get(
  '/',
  [
    query('type')
      .optional()
      .isIn(['sale_invoice', 'purchase_order', 'quotation', 'proforma_invoice', 'credit_note', 'debit_note', 'delivery_note', 'receipt'])
      .withMessage('Invalid document type'),
    
    query('status')
      .optional()
      .isIn(['draft', 'pending', 'sent', 'paid', 'partial', 'overdue', 'cancelled', 'void'])
      .withMessage('Invalid status'),
    
    query('customerId')
      .optional()
      .custom((value) => {
        if (value && !mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid customer ID');
        }
        return true;
      }),
    
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format'),
    
    query('search')
      .optional()
      .trim(),
    
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
  invoiceController.getAll
);

/**
 * GET /api/invoices/next-number
 * Get next invoice number
 */
router.get(
  '/next-number',
  [
    query('type')
      .optional()
      .isIn(['sale_invoice', 'purchase_order', 'quotation', 'proforma_invoice', 'credit_note', 'debit_note', 'delivery_note', 'receipt'])
      .withMessage('Invalid document type'),
    validate,
  ],
  invoiceController.getNextNumber
);

/**
 * GET /api/invoices/number/:number
 * Get invoice by invoice number
 */
router.get(
  '/number/:number',
  [
    param('number')
      .trim()
      .notEmpty()
      .withMessage('Invoice number is required'),
    validate,
  ],
  invoiceController.getByNumber
);

/**
 * GET /api/invoices/:id
 * Get invoice by ID
 */
router.get(
  '/:id',
  [
    param('id')
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid invoice ID');
        }
        return true;
      }),
    validate,
  ],
  invoiceController.getById
);

/**
 * POST /api/invoices
 * Create new invoice
 */
router.post(
  '/',
  [
    body('type')
      .optional()
      .isIn(['sale_invoice', 'purchase_order', 'quotation', 'proforma_invoice', 'credit_note', 'debit_note', 'delivery_note', 'receipt'])
      .withMessage('Invalid document type'),
    
    body('to.customerName')
      .trim()
      .notEmpty()
      .withMessage('Customer name is required'),
    
    body('to.address.name')
      .trim()
      .notEmpty()
      .withMessage('Customer address name is required'),
    
    body('to.address.line1')
      .trim()
      .notEmpty()
      .withMessage('Address line 1 is required'),
    
    body('to.address.city')
      .trim()
      .notEmpty()
      .withMessage('City is required'),
    
    body('to.address.state')
      .trim()
      .notEmpty()
      .withMessage('State is required'),
    
    body('to.address.zipCode')
      .trim()
      .notEmpty()
      .withMessage('ZIP code is required'),
    
    body('to.address.country')
      .trim()
      .notEmpty()
      .withMessage('Country is required'),
    
    body('items')
      .isArray({ min: 1 })
      .withMessage('Invoice must have at least one item'),
    
    body('items.*.productId')
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid product ID');
        }
        return true;
      }),
    
    body('items.*.productName')
      .trim()
      .notEmpty()
      .withMessage('Product name is required'),
    
    body('items.*.quantity')
      .isFloat({ min: 0.001 })
      .withMessage('Quantity must be greater than 0'),
    
    body('items.*.unitPrice')
      .isFloat({ min: 0 })
      .withMessage('Unit price must be 0 or greater'),
    
    validate,
  ],
  auditMiddleware({ action: 'create', entityType: 'invoice' }),
  invoiceController.create
);

/**
 * PUT /api/invoices/:id
 * Update invoice
 */
router.put(
  '/:id',
  [
    param('id')
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid invoice ID');
        }
        return true;
      }),
    validate,
  ],
  auditMiddleware({ action: 'update', entityType: 'invoice' }),
  invoiceController.update
);

/**
 * DELETE /api/invoices/:id
 * Delete invoice (draft only)
 */
router.delete(
  '/:id',
  [
    param('id')
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid invoice ID');
        }
        return true;
      }),
    validate,
  ],
  auditMiddleware({ action: 'delete', entityType: 'invoice' }),
  invoiceController.delete
);

/**
 * PATCH /api/invoices/:id/status
 * Update invoice status
 */
router.patch(
  '/:id/status',
  [
    param('id')
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid invoice ID');
        }
        return true;
      }),
    
    body('status')
      .isIn(['draft', 'pending', 'sent', 'paid', 'partial', 'overdue', 'cancelled', 'void'])
      .withMessage('Invalid status'),
    
    validate,
  ],
  auditMiddleware({ action: 'update', entityType: 'invoice' }),
  invoiceController.updateStatus
);

/**
 * POST /api/invoices/:id/payments
 * Record payment for invoice
 */
router.post(
  '/:id/payments',
  [
    param('id')
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid invoice ID');
        }
        return true;
      }),
    
    body('method')
      .isIn(['cash', 'card', 'mobile', 'bank', 'cheque', 'credit'])
      .withMessage('Invalid payment method'),
    
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Payment amount must be greater than 0'),
    
    body('reference')
      .optional()
      .trim(),
    
    body('date')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    
    validate,
  ],
  auditMiddleware({
    action: 'update',
    entityType: 'invoice',
    metadataBuilder: (req) => ({
      payment: {
        method: req.body.method,
        amount: req.body.amount,
        reference: req.body.reference,
        date: req.body.date,
      },
    }),
  }),
  invoiceController.recordPayment
);

/**
 * POST /api/invoices/generate
 * Generate invoice from sale
 */
router.post(
  '/generate',
  [
    body('saleId')
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid sale ID');
        }
        return true;
      }),
    validate,
  ],
  auditMiddleware({ action: 'create', entityType: 'invoice' }),
  invoiceController.generateFromSale
);

/**
 * POST /api/invoices/:id/convert
 * Convert quotation to invoice
 */
router.post(
  '/:id/convert',
  [
    param('id')
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid invoice ID');
        }
        return true;
      }),
    validate,
  ],
  auditMiddleware({ action: 'create', entityType: 'invoice' }),
  invoiceController.convertQuotation
);

/**
 * POST /api/invoices/:id/duplicate
 * Duplicate invoice
 */
router.post(
  '/:id/duplicate',
  [
    param('id')
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid invoice ID');
        }
        return true;
      }),
    validate,
  ],
  auditMiddleware({ action: 'create', entityType: 'invoice' }),
  invoiceController.duplicate
);

/**
 * POST /api/invoices/:id/send
 * Send invoice via email
 */
router.post(
  '/:id/send',
  [
    param('id')
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid invoice ID');
        }
        return true;
      }),
    
    body('email')
      .trim()
      .isEmail()
      .withMessage('Valid email is required'),
    
    body('message')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Message must be 2000 characters or fewer'),
    
    body('subject')
      .optional()
      .trim()
      .isLength({ max: 150 })
      .withMessage('Subject must be 150 characters or fewer'),
    
    body('attachPdf')
      .optional()
      .isBoolean()
      .withMessage('attachPdf must be a boolean')
      .toBoolean(),
    
    body('cc')
      .optional()
      .isArray({ max: 5 })
      .withMessage('cc must be an array of email addresses'),
    
    body('cc.*')
      .optional()
      .isEmail()
      .withMessage('Each cc entry must be a valid email'),
    
    body('bcc')
      .optional()
      .isArray({ max: 5 })
      .withMessage('bcc must be an array of email addresses'),
    
    body('bcc.*')
      .optional()
      .isEmail()
      .withMessage('Each bcc entry must be a valid email'),
    
    validate,
  ],
  invoiceController.sendEmail
);

/**
 * POST /api/invoices/:id/send-sms
 * Send invoice via SMS
 */
router.post(
  '/:id/send-sms',
  [
    param('id')
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid invoice ID');
        }
        return true;
      }),
    
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required'),
    
    body('message')
      .optional()
      .trim()
      .isLength({ max: 320 })
      .withMessage('Message must be 320 characters or fewer'),
    
    validate,
  ],
  invoiceController.sendSMS
);

/**
 * GET /api/invoices/:id/pdf
 * Generate PDF
 */
router.get(
  '/:id/pdf',
  [
    param('id')
      .custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Invalid invoice ID');
        }
        return true;
      }),
    validate,
  ],
  invoiceController.generatePDF
);

export default router;

