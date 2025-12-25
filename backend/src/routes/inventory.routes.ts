import { Router, Request, Response, NextFunction } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { body, param, query } from 'express-validator';
import { requireFormAccess } from '../middleware/formPermission.middleware';

const router = Router();
const inventoryController = new InventoryController();

// All routes require authentication
// Note: resolveTenant is already applied in routes/index.ts
router.use((req: Request, res: Response, next: NextFunction) => authenticate(req as any, res, next));

// All inventory routes require form access
router.use((req: Request, res: Response, next: NextFunction) => requireFormAccess('frmShopInventory')(req as any, res, next));

/**
 * Validation rules
 */
const adjustStockValidation = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('storeId')
    .notEmpty()
    .withMessage('Store ID is required')
    .isMongoId()
    .withMessage('Invalid store ID'),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt()
    .withMessage('Quantity must be an integer'),
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['adjustment', 'restock', 'damage', 'return', 'initial'])
    .withMessage('Invalid adjustment type'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

const getMovementsValidation = [
  query('productId').optional().isMongoId().withMessage('Invalid product ID'),
  query('storeId').optional().isMongoId().withMessage('Invalid store ID'),
  query('type')
    .optional()
    .isIn([
      'sale',
      'adjustment',
      'transfer_in',
      'transfer_out',
      'return',
      'damage',
      'restock',
      'initial',
    ])
    .withMessage('Invalid movement type'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

const getAlertsValidation = [
  query('type')
    .optional()
    .isIn(['low_stock', 'out_of_stock', 'overstock'])
    .withMessage('Invalid alert type'),
  query('storeId').optional().isMongoId().withMessage('Invalid store ID'),
  query('status')
    .optional()
    .isIn(['active', 'resolved', 'acknowledged'])
    .withMessage('Invalid status'),
];

const acknowledgeAlertValidation = [param('id').isMongoId().withMessage('Invalid alert ID')];

const storeIdValidation = [query('storeId').optional().isMongoId().withMessage('Invalid store ID')];

const transferStockValidation = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('fromStoreId')
    .notEmpty()
    .withMessage('Source store is required')
    .isMongoId()
    .withMessage('Invalid source store ID'),
  body('toStoreId')
    .notEmpty()
    .withMessage('Destination store is required')
    .isMongoId()
    .withMessage('Invalid destination store ID')
    .custom((value, { req }) => value !== req.body.fromStoreId)
    .withMessage('Destination store must be different from source store'),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

/**
 * Routes
 */

// GET /api/inventory/status - Get inventory status summary (must be before others)
router.get('/status', storeIdValidation, validate, inventoryController.getStatus);

// GET /api/inventory/valuation - Get inventory valuation
router.get('/valuation', storeIdValidation, validate, inventoryController.getValuation);

// GET /api/inventory/low-stock - Get low stock products
router.get('/low-stock', storeIdValidation, validate, inventoryController.getLowStock);

// GET /api/inventory/movements - Get stock movement history
router.get('/movements', getMovementsValidation, validate, inventoryController.getMovements);

// GET /api/inventory/alerts - Get active alerts
router.get('/alerts', getAlertsValidation, validate, inventoryController.getAlerts);

// POST /api/inventory/adjust - Adjust stock
router.post('/adjust', adjustStockValidation, validate, inventoryController.adjustStock);

// POST /api/inventory/transfer - Transfer stock between stores
router.post('/transfer', transferStockValidation, validate, inventoryController.transferStock);

// POST /api/inventory/alerts/:id/acknowledge - Acknowledge alert
router.post(
  '/alerts/:id/acknowledge',
  acknowledgeAlertValidation,
  validate,
  inventoryController.acknowledgeAlert
);

export default router;
