import { Router, Request, Response, NextFunction } from 'express';
import { ExportController } from '../controllers/export.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { query } from 'express-validator';

const router = Router();
const exportController = new ExportController();

// All routes require authentication
// Note: resolveTenant is already applied in routes/index.ts
router.use((req: Request, res: Response, next: NextFunction) => authenticate(req as any, res, next));

/**
 * Validation rules
 */
const dateRangeValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
];

/**
 * Routes
 */

// GET /api/export/products - Export products
router.get('/products', exportController.exportProducts);

// GET /api/export/sales - Export sales
router.get(
  '/sales',
  dateRangeValidation,
  validate,
  exportController.exportSales
);

// GET /api/export/customers - Export customers
router.get('/customers', exportController.exportCustomers);

// GET /api/export/inventory-movements - Export inventory movements
router.get(
  '/inventory-movements',
  dateRangeValidation,
  validate,
  exportController.exportInventoryMovements
);

export default router;

