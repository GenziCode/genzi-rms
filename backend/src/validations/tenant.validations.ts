import { body, param } from 'express-validator';
import { isValidEmail, isValidPassword, isValidSubdomain } from '../utils/validators';
import { SubscriptionPlan, SubscriptionStatus } from '../types';

/**
 * Tenant Registration Validations
 */
export const registerTenantValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Tenant name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Tenant name must be between 2 and 100 characters'),

  body('subdomain')
    .trim()
    .notEmpty()
    .withMessage('Subdomain is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Subdomain must be between 3 and 30 characters')
    .custom((value) => {
      if (!isValidSubdomain(value)) {
        throw new Error('Invalid subdomain format. Use only lowercase letters, numbers, and hyphens');
      }
      return true;
    }),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .custom((value) => {
      if (!isValidEmail(value)) {
        throw new Error('Invalid email format');
      }
      return true;
    }),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .custom((value) => {
      if (!isValidPassword(value)) {
        throw new Error(
          'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number'
        );
      }
      return true;
    }),

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

  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage('Invalid phone number format'),
];

/**
 * Check Subdomain Validations
 */
export const checkSubdomainValidation = [
  param('subdomain')
    .trim()
    .notEmpty()
    .custom((value) => {
      if (!isValidSubdomain(value)) {
        throw new Error('Invalid subdomain format');
      }
      return true;
    }),
];

/**
 * Tenant ID Parameter Validation
 */
export const tenantIdParamValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Tenant ID is required')
    .isMongoId()
    .withMessage('Invalid tenant ID'),
];

/**
 * Update Tenant Limits Validations
 */
export const updateTenantLimitsValidation = [
  body(['limits.users', 'users'])
    .optional()
    .isInt({ min: 0 })
    .withMessage('User limit must be a positive integer'),
  body(['limits.stores', 'stores'])
    .optional()
    .isInt({ min: 0 })
    .withMessage('Store limit must be a positive integer'),
  body(['limits.products', 'products'])
    .optional()
    .isInt({ min: 0 })
    .withMessage('Product limit must be a positive integer'),
  body(['limits.monthlyTransactions', 'monthlyTransactions'])
    .optional()
    .isInt({ min: 0 })
    .withMessage('Monthly transaction limit must be a positive integer'),
  body(['limits.storageBytes', 'storageBytes'])
    .optional()
    .isInt({ min: 0 })
    .withMessage('Storage limit must be a positive integer'),
];

/**
 * Update Tenant Plan Validations
 */
export const updateTenantPlanValidation = [
  body('plan')
    .optional()
    .isIn(Object.values(SubscriptionPlan))
    .withMessage('Invalid plan specified'),
  body('billingCycle')
    .optional()
    .isIn(['monthly', 'yearly'])
    .withMessage('Billing cycle must be monthly or yearly'),
  body('status')
    .optional()
    .isIn(Object.values(SubscriptionStatus))
    .withMessage('Invalid subscription status'),
];

/**
 * Suspend Tenant Validations
 */
export const suspendTenantValidation = [
  body('reason').optional().isString().isLength({ max: 500 }),
  body('effectiveAt').optional().isISO8601(),
];

