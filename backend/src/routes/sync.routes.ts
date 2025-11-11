import { Router } from 'express';
import { SyncController } from '../controllers/sync.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { validate } from '../middleware/validation.middleware';
import { body, param } from 'express-validator';

const router = Router();
const syncController = new SyncController();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(resolveTenant);

/**
 * Validation rules
 */
const pullDataValidation = [
  body('lastSync')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
];

const pushSalesValidation = [
  body('sales')
    .isArray({ min: 1 })
    .withMessage('Sales must be a non-empty array'),
];

const deviceIdValidation = [
  param('deviceId')
    .trim()
    .notEmpty()
    .withMessage('Device ID is required'),
];

/**
 * Routes
 */

// POST /api/sync/pull - Pull data for offline cache
router.post(
  '/pull',
  pullDataValidation,
  validate,
  syncController.pullData
);

// POST /api/sync/push - Push offline sales
router.post(
  '/push',
  pushSalesValidation,
  validate,
  syncController.pushSales
);

// GET /api/sync/status/:deviceId - Get sync status
router.get(
  '/status/:deviceId',
  deviceIdValidation,
  validate,
  syncController.getSyncStatus
);

export default router;

