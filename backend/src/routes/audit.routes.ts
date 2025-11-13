import { Router } from 'express';
import { query, param } from 'express-validator';
import { auditController } from '../controllers/audit.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { isValidMongoId } from '../utils/validators';

const router = Router();

// Apply authentication and tenant resolution to all routes
router.use(authenticate, resolveTenant);

/**
 * GET /api/audit-logs/statistics
 * Get audit statistics
 */
router.get(
  '/statistics',
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date'),
    
    validate,
  ],
  auditController.getStatistics
);

/**
 * GET /api/audit-logs/export
 * Export audit logs as CSV
 */
router.get(
  '/export',
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date'),
    
    query('userId')
      .optional()
      .custom((value) => {
        if (value && !isValidMongoId(value)) {
          throw new Error('Invalid user ID');
        }
        return true;
      }),
    
    query('entityType')
      .optional()
      .trim(),
    
    validate,
  ],
  auditController.export
);

/**
 * GET /api/audit-logs/entity/:type/:id
 * Get logs for specific entity
 */
router.get(
  '/entity/:type/:id',
  [
    param('type')
      .trim()
      .notEmpty()
      .withMessage('Entity type is required'),
    
    param('id')
      .custom((value) => {
        if (!isValidMongoId(value)) {
          throw new Error('Invalid entity ID');
        }
        return true;
      }),
    
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
  auditController.getEntityLogs
);

/**
 * GET /api/audit-logs/user/:userId
 * Get user activity
 */
router.get(
  '/user/:userId',
  [
    param('userId')
      .custom((value) => {
        if (!isValidMongoId(value)) {
          throw new Error('Invalid user ID');
        }
        return true;
      }),
    
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
  auditController.getUserActivity
);

/**
 * GET /api/audit-logs
 * Get all audit logs
 */
router.get(
  '/',
  [
    query('userId')
      .optional()
      .custom((value) => {
        if (value && !isValidMongoId(value)) {
          throw new Error('Invalid user ID');
        }
        return true;
      }),
    
    query('action')
      .optional()
      .isIn(['create', 'read', 'update', 'delete', 'login', 'logout', 'password_change', 'password_reset', 'permission_change', 'status_change', 'export', 'import', 'payment', 'refund'])
      .withMessage('Invalid action'),
    
    query('entityType')
      .optional()
      .trim(),
    
    query('entityId')
      .optional()
      .custom((value) => {
        if (value && !isValidMongoId(value)) {
          throw new Error('Invalid entity ID');
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
  auditController.getAll
);

export default router;

