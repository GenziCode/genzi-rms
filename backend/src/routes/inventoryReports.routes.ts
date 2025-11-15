import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { query } from 'express-validator';
import { resolveTenant } from '../middleware/tenant.middleware';
import { inventoryReportsController } from '../controllers/inventoryReports.controller';

const router = Router();

router.use(authenticate);
router.use(resolveTenant);

router.get(
  '/current-stock',
  [
    query('storeId').optional().isMongoId().withMessage('Invalid storeId'),
    query('categoryId').optional().isMongoId().withMessage('Invalid categoryId'),
    validate,
  ],
  inventoryReportsController.getCurrentStockStatus
);

router.get(
  '/low-stock',
  [
    query('storeId').optional().isMongoId().withMessage('Invalid storeId'),
    query('categoryId').optional().isMongoId().withMessage('Invalid categoryId'),
    query('threshold').optional().isInt({ min: 1 }).withMessage('Threshold must be positive'),
    validate,
  ],
  inventoryReportsController.getLowStockReport
);

router.get(
  '/overstock',
  [
    query('storeId').optional().isMongoId().withMessage('Invalid storeId'),
    query('categoryId').optional().isMongoId().withMessage('Invalid categoryId'),
    query('threshold').optional().isInt({ min: 1 }).withMessage('Threshold must be positive'),
    validate,
  ],
  inventoryReportsController.getOverstockReport
);

router.get(
  '/valuation',
  [
    query('storeId').optional().isMongoId().withMessage('Invalid storeId'),
    query('categoryId').optional().isMongoId().withMessage('Invalid categoryId'),
    validate,
  ],
  inventoryReportsController.getInventoryValuation
);

router.get(
  '/movements',
  [
    query('storeId').optional().isMongoId().withMessage('Invalid storeId'),
    query('productId').optional().isMongoId().withMessage('Invalid productId'),
    query('type').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    validate,
  ],
  inventoryReportsController.getStockMovement
);

export default router;


