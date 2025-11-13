import { body, param, query } from 'express-validator';
import mongoose from 'mongoose';

/**
 * Invoice Document Types
 */
const INVOICE_TYPES = [
  'sale_invoice',
  'purchase_order',
  'quotation',
  'proforma_invoice',
  'credit_note',
  'debit_note',
  'delivery_note',
  'receipt',
];

/**
 * Invoice Statuses
 */
const INVOICE_STATUSES = [
  'draft',
  'pending',
  'sent',
  'paid',
  'partial',
  'overdue',
  'cancelled',
  'void',
];

/**
 * Get Invoices Query Validations
 */
export const getInvoicesValidation = [
  query('type').optional().isIn(INVOICE_TYPES).withMessage('Invalid document type'),
  query('status').optional().isIn(INVOICE_STATUSES).withMessage('Invalid status'),
  query('customerId')
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid customer ID');
      }
      return true;
    }),
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('search').optional().trim(),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];

/**
 * Get Next Invoice Number Validations
 */
export const getNextNumberValidation = [
  query('type').optional().isIn(INVOICE_TYPES).withMessage('Invalid document type'),
];

/**
 * Invoice Number Parameter Validation
 */
export const invoiceNumberParamValidation = [
  param('number').trim().notEmpty().withMessage('Invoice number is required'),
];

/**
 * Invoice ID Parameter Validation
 */
export const invoiceIdParamValidation = [
  param('id')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid invoice ID');
      }
      return true;
    }),
];

/**
 * Create Invoice Validations
 */
export const createInvoiceValidation = [
  body('type').optional().isIn(INVOICE_TYPES).withMessage('Invalid document type'),
  body('to.customerName').trim().notEmpty().withMessage('Customer name is required'),
  body('to.address.name').trim().notEmpty().withMessage('Customer address name is required'),
  body('to.address.line1').trim().notEmpty().withMessage('Address line 1 is required'),
  body('to.address.city').trim().notEmpty().withMessage('City is required'),
  body('to.address.state').trim().notEmpty().withMessage('State is required'),
  body('to.address.zipCode').trim().notEmpty().withMessage('ZIP code is required'),
  body('to.address.country').trim().notEmpty().withMessage('Country is required'),
  body('items').isArray({ min: 1 }).withMessage('Invoice must have at least one item'),
  body('items.*.productId').custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error('Invalid product ID');
    }
    return true;
  }),
  body('items.*.productName').trim().notEmpty().withMessage('Product name is required'),
  body('items.*.quantity').isFloat({ min: 0.001 }).withMessage('Quantity must be greater than 0'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be 0 or greater'),
];

/**
 * Update Invoice Status Validations
 */
export const updateInvoiceStatusValidation = [
  body('status').isIn(INVOICE_STATUSES).withMessage('Invalid status'),
];

/**
 * Record Payment Validations
 */
export const recordPaymentValidation = [
  body('method')
    .isIn(['cash', 'card', 'mobile', 'bank', 'cheque', 'credit'])
    .withMessage('Invalid payment method'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Payment amount must be greater than 0'),
  body('reference').optional().trim(),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
];

/**
 * Generate Invoice from Sale Validations
 */
export const generateFromSaleValidation = [
  body('saleId').custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error('Invalid sale ID');
    }
    return true;
  }),
];

/**
 * Send Invoice Email Validations
 */
export const sendInvoiceEmailValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required'),
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
  body('cc.*').optional().isEmail().withMessage('Each cc entry must be a valid email'),
  body('bcc')
    .optional()
    .isArray({ max: 5 })
    .withMessage('bcc must be an array of email addresses'),
  body('bcc.*').optional().isEmail().withMessage('Each bcc entry must be a valid email'),
];

/**
 * Send Invoice SMS Validations
 */
export const sendInvoiceSMSValidation = [
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 320 })
    .withMessage('Message must be 320 characters or fewer'),
];

