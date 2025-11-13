import { Router } from 'express';
import { SyncController } from '../controllers/sync.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { body, param } from 'express-validator';
import { auditMiddleware } from '../middleware/audit.middleware';

const router = Router();
const syncController = new SyncController();

// All routes require authentication
// Note: resolveTenant is already applied in routes/index.ts
router.use(authenticate);

/**
 * Validation rules
 */
const deviceContextValidation = [
  body('device')
    .optional()
    .isObject()
    .withMessage('Device context must be an object'),
  body('device.deviceId')
    .if(body('device').exists())
    .notEmpty()
    .withMessage('device.deviceId is required when sending device context'),
  body('device.storeId')
    .optional()
    .isMongoId()
    .withMessage('device.storeId must be a valid ID'),
  body('device.queueSize')
    .optional()
    .isInt({ min: 0 })
    .withMessage('device.queueSize must be a positive integer'),
];

const pullDataValidation = [
  body('lastSync')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  ...deviceContextValidation,
];

const pushSalesValidation = [
  body('sales')
    .isArray({ min: 1 })
    .withMessage('Sales must be a non-empty array'),
  ...deviceContextValidation,
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
  auditMiddleware('import', 'Sale'),
  syncController.pushSales
);

// GET /api/sync/status/:deviceId - Get sync status
router.get(
  '/status/:deviceId',
  deviceIdValidation,
  validate,
  syncController.getSyncStatus
);

// GET /api/sync/devices - List sync devices
router.get('/devices', syncController.listDevices);

export default router;

