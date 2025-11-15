import { Router } from 'express';
import { query } from 'express-validator';
import { salesReportsController } from '../controllers/salesReports.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

router.use(authenticate);

/**
 * Sales Reports Routes
 * All routes require authentication and are prefixed with /api/reports/sales
 */

router.get(
  '/daily-summary',
  [
    query('startDate').optional().isISO8601().toDate().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().toDate().withMessage('Invalid end date'),
    query('storeId').optional().isMongoId().withMessage('Invalid store ID'),
    validate,
  ],
  salesReportsController.getDailySalesSummary
);

router.get(
  '/weekly',
  [
    query('weekStart').optional().isISO8601().toDate().withMessage('Invalid week start date'),
    query('weekEnd').optional().isISO8601().toDate().withMessage('Invalid week end date'),
    query('storeId').optional().isMongoId().withMessage('Invalid store ID'),
    validate,
  ],
  salesReportsController.getWeeklySales
);

router.get(
  '/monthly',
  [
    query('month').optional().isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
    query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Invalid year'),
    query('storeId').optional().isMongoId().withMessage('Invalid store ID'),
    validate,
  ],
  salesReportsController.getMonthlySales
);

router.get(
  '/by-product',
  [
    query('startDate').optional().isISO8601().toDate().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().toDate().withMessage('Invalid end date'),
    query('productId').optional().isMongoId().withMessage('Invalid product ID'),
    query('storeId').optional().isMongoId().withMessage('Invalid store ID'),
    validate,
  ],
  salesReportsController.getSalesByProduct
);

router.get(
  '/by-category',
  [
    query('startDate').optional().isISO8601().toDate().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().toDate().withMessage('Invalid end date'),
    query('categoryId').optional().isMongoId().withMessage('Invalid category ID'),
    query('storeId').optional().isMongoId().withMessage('Invalid store ID'),
    validate,
  ],
  salesReportsController.getSalesByCategory
);

router.get(
  '/by-store',
  [
    query('startDate').optional().isISO8601().toDate().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().toDate().withMessage('Invalid end date'),
    query('storeIds').optional().isArray().withMessage('Store IDs must be an array'),
    query('storeIds.*').optional().isMongoId().withMessage('Invalid store ID'),
    validate,
  ],
  salesReportsController.getSalesByStore
);

router.get(
  '/by-employee',
  [
    query('startDate').optional().isISO8601().toDate().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().toDate().withMessage('Invalid end date'),
    query('employeeId').optional().isMongoId().withMessage('Invalid employee ID'),
    query('storeId').optional().isMongoId().withMessage('Invalid store ID'),
    validate,
  ],
  salesReportsController.getSalesByEmployee
);

router.get(
  '/by-customer',
  [
    query('startDate').optional().isISO8601().toDate().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().toDate().withMessage('Invalid end date'),
    query('customerId').optional().isMongoId().withMessage('Invalid customer ID'),
    query('storeId').optional().isMongoId().withMessage('Invalid store ID'),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
    validate,
  ],
  salesReportsController.getSalesByCustomer
);

router.get(
  '/comparison',
  [
    query('period1Start').isISO8601().toDate().withMessage('Period 1 start date is required'),
    query('period1End').isISO8601().toDate().withMessage('Period 1 end date is required'),
    query('period2Start').isISO8601().toDate().withMessage('Period 2 start date is required'),
    query('period2End').isISO8601().toDate().withMessage('Period 2 end date is required'),
    query('storeId').optional().isMongoId().withMessage('Invalid store ID'),
    validate,
  ],
  salesReportsController.getSalesComparison
);

router.get(
  '/top-products',
  [
    query('startDate').optional().isISO8601().toDate().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().toDate().withMessage('Invalid end date'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['revenue', 'quantity', 'transactions']).withMessage('Invalid sort by value'),
    query('storeId').optional().isMongoId().withMessage('Invalid store ID'),
    validate,
  ],
  salesReportsController.getTopSellingProducts
);

router.get(
  '/bottom-products',
  [
    query('startDate').optional().isISO8601().toDate().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().toDate().withMessage('Invalid end date'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['revenue', 'quantity', 'transactions']).withMessage('Invalid sort by value'),
    query('storeId').optional().isMongoId().withMessage('Invalid store ID'),
    validate,
  ],
  salesReportsController.getBottomSellingProducts
);

router.get(
  '/trend-analysis',
  [
    query('startDate').optional().isISO8601().toDate().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().toDate().withMessage('Invalid end date'),
    query('period').optional().isIn(['day', 'week', 'month']).withMessage('Invalid period'),
    query('storeId').optional().isMongoId().withMessage('Invalid store ID'),
    validate,
  ],
  salesReportsController.getSalesTrendAnalysis
);

router.get(
  '/discount-analysis',
  [
    query('startDate').optional().isISO8601().toDate().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().toDate().withMessage('Invalid end date'),
    query('storeId').optional().isMongoId().withMessage('Invalid store ID'),
    validate,
  ],
  salesReportsController.getDiscountAnalysis
);

router.get(
  '/returns-refunds',
  [
    query('startDate').optional().isISO8601().toDate().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().toDate().withMessage('Invalid end date'),
    query('storeId').optional().isMongoId().withMessage('Invalid store ID'),
    validate,
  ],
  salesReportsController.getReturnRefundReport
);

router.get(
  '/forecast',
  [
    query('forecastDays').optional().isInt({ min: 1, max: 365 }).withMessage('Forecast days must be between 1 and 365'),
    query('storeId').optional().isMongoId().withMessage('Invalid store ID'),
    validate,
  ],
  salesReportsController.getSalesForecast
);

export default router;
