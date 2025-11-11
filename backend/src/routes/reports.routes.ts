import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { validate } from '../middleware/validation.middleware';
import { query } from 'express-validator';

const router = Router();
const reportsController = new ReportsController();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(resolveTenant);

/**
 * Validation rules
 */
const dateRangeValidation = [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
];

const dashboardValidation = [
  query('period')
    .optional()
    .isIn(['today', 'week', 'month'])
    .withMessage('Invalid period. Must be: today, week, or month'),
];

const topProductsValidation = [
  ...dateRangeValidation,
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

/**
 * Routes
 */

// GET /api/reports/dashboard - Dashboard KPIs
router.get('/dashboard', dashboardValidation, validate, reportsController.getDashboard);

// GET /api/reports/sales-trends - Sales trends
router.get('/sales-trends', dateRangeValidation, validate, reportsController.getSalesTrends);

// GET /api/reports/top-products - Top selling products
router.get('/top-products', topProductsValidation, validate, reportsController.getTopProducts);

// GET /api/reports/payment-methods - Payment methods analysis
router.get('/payment-methods', dateRangeValidation, validate, reportsController.getPaymentMethods);

// GET /api/reports/profit-loss - Profit & Loss report
router.get('/profit-loss', dateRangeValidation, validate, reportsController.getProfitLoss);

// GET /api/reports/inventory-valuation - Inventory valuation
router.get('/inventory-valuation', reportsController.getInventoryValuation);

// GET /api/reports/customer-insights - Customer insights
router.get(
  '/customer-insights',
  dateRangeValidation,
  validate,
  reportsController.getCustomerInsights
);

// GET /api/reports/vendor-performance - Vendor performance
router.get(
  '/vendor-performance',
  dateRangeValidation,
  validate,
  reportsController.getVendorPerformance
);

export default router;
