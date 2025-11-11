import { Router } from 'express';
import { body, param } from 'express-validator';
import { tenantController } from '../controllers/tenant.controller';
import { validate } from '../middleware/validation.middleware';
import { isValidEmail, isValidPassword, isValidSubdomain } from '../utils/validators';

const router = Router();

/**
 * POST /api/tenants/register
 * Register new tenant
 */
router.post(
  '/register',
  [
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
    
    validate,
  ],
  tenantController.register
);

/**
 * GET /api/tenants/check-subdomain/:subdomain
 * Check subdomain availability
 */
router.get(
  '/check-subdomain/:subdomain',
  [
    param('subdomain')
      .trim()
      .notEmpty()
      .custom((value) => {
        if (!isValidSubdomain(value)) {
          throw new Error('Invalid subdomain format');
        }
        return true;
      }),
    validate,
  ],
  tenantController.checkSubdomain
);

export default router;

