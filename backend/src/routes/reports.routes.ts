import { Router, Request, Response, NextFunction } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { reportGenerationController } from '../controllers/reportGeneration.controller';
import { salesReportsController } from '../controllers/salesReports.controller';
import { inventoryReportsController } from '../controllers/inventoryReports.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { query, param, body } from 'express-validator';

const router = Router();
const reportsController = new ReportsController();

// All routes require authentication
// Note: resolveTenant is already applied in routes/index.ts
router.use((req: Request, res: Response, next: NextFunction) => authenticate(req as any, res, next));

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

/**
 * Sales Reports Routes
 */

// GET /api/reports/sales/daily-summary - Daily Sales Summary
router.get(
  '/sales/daily-summary',
  dateRangeValidation,
  validate,
  salesReportsController.getDailySalesSummary
);

// GET /api/reports/sales/weekly - Weekly Sales Report
router.get('/sales/weekly', dateRangeValidation, validate, salesReportsController.getWeeklySales);

// GET /api/reports/sales/monthly - Monthly Sales Report
router.get(
  '/sales/monthly',
  [
    query('month').optional().isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
    query('year').optional().isInt({ min: 2000 }).withMessage('Invalid year'),
    query('storeId').optional().isMongoId().withMessage('Invalid store ID'),
    validate,
  ],
  salesReportsController.getMonthlySales
);

// GET /api/reports/sales/by-product - Sales by Product
router.get(
  '/sales/by-product',
  dateRangeValidation,
  validate,
  salesReportsController.getSalesByProduct
);

// GET /api/reports/sales/by-category - Sales by Category
router.get(
  '/sales/by-category',
  dateRangeValidation,
  validate,
  salesReportsController.getSalesByCategory
);

// GET /api/reports/sales/by-store - Sales by Store
router.get('/sales/by-store', dateRangeValidation, validate, salesReportsController.getSalesByStore);

// GET /api/reports/sales/by-employee - Sales by Employee/Cashier
router.get(
  '/sales/by-employee',
  dateRangeValidation,
  validate,
  salesReportsController.getSalesByEmployee
);

// GET /api/reports/sales/by-customer - Sales by Customer
router.get(
  '/sales/by-customer',
  [
    ...dateRangeValidation,
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
    validate,
  ],
  salesReportsController.getSalesByCustomer
);

// GET /api/reports/sales/comparison - Sales Comparison
router.get(
  '/sales/comparison',
  [
    query('period1Start').isISO8601().withMessage('Invalid period1Start date format'),
    query('period1End').isISO8601().withMessage('Invalid period1End date format'),
    query('period2Start').isISO8601().withMessage('Invalid period2Start date format'),
    query('period2End').isISO8601().withMessage('Invalid period2End date format'),
    query('storeId').optional().isMongoId().withMessage('Invalid store ID'),
    validate,
  ],
  salesReportsController.getSalesComparison
);

// GET /api/reports/sales/top-products - Top Selling Products
router.get(
  '/sales/top-products',
  [
    ...dateRangeValidation,
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy')
      .optional()
      .isIn(['revenue', 'quantity', 'transactions'])
      .withMessage('sortBy must be: revenue, quantity, or transactions'),
    validate,
  ],
  salesReportsController.getTopSellingProducts
);

// GET /api/reports/sales/bottom-products - Bottom Selling Products
router.get(
  '/sales/bottom-products',
  [
    ...dateRangeValidation,
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy')
      .optional()
      .isIn(['revenue', 'quantity', 'transactions'])
      .withMessage('sortBy must be: revenue, quantity, or transactions'),
    validate,
  ],
  salesReportsController.getBottomSellingProducts
);

// GET /api/reports/sales/trend-analysis - Sales Trend Analysis
router.get(
  '/sales/trend-analysis',
  [
    ...dateRangeValidation,
    query('period').optional().isIn(['day', 'week', 'month']).withMessage('Period must be: day, week, or month'),
    validate,
  ],
  salesReportsController.getSalesTrendAnalysis
);

// GET /api/reports/sales/discount-analysis - Discount Analysis
router.get(
  '/sales/discount-analysis',
  dateRangeValidation,
  validate,
  salesReportsController.getDiscountAnalysis
);

// GET /api/reports/sales/returns-refunds - Return/Refund Report
router.get(
  '/sales/returns-refunds',
  dateRangeValidation,
  validate,
  salesReportsController.getReturnRefundReport
);

// GET /api/reports/sales/forecast - Sales Forecast
router.get(
  '/sales/forecast',
  [
    query('forecastDays').optional().isInt({ min: 1, max: 365 }).withMessage('Forecast days must be between 1 and 365'),
    query('storeId').optional().isMongoId().withMessage('Invalid store ID'),
    validate,
  ],
  salesReportsController.getSalesForecast
);

// POST /api/reports/generate/:templateId - Generate report from template
router.post(
  '/generate/:templateId',
  [
    param('templateId').isMongoId().withMessage('Invalid template ID'),
    body('parameters').optional().isObject().withMessage('Parameters must be an object'),
    validate,
  ],
  reportGenerationController.generateReport
);

// GET /api/reports/executions - Get execution history
router.get(
  '/executions',
  [
    query('templateId').optional().isMongoId().withMessage('Invalid template ID'),
    query('scheduleId').optional().isMongoId().withMessage('Invalid schedule ID'),
    query('status')
      .optional()
      .isIn(['pending', 'running', 'completed', 'failed', 'cancelled']),
    query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Invalid limit'),
    validate,
  ],
  reportGenerationController.getExecutionHistory
);

/**
 * Inventory Reports Routes
 */

// GET /api/reports/inventory/current-stock - Current Stock Status
router.get(
  '/inventory/current-stock',
  [
    query('storeId').optional().isMongoId().withMessage('Invalid store ID'),
    query('categoryId').optional().isMongoId().withMessage('Invalid category ID'),
    query('lowStockOnly').optional().isBoolean().withMessage('lowStockOnly must be boolean'),
    query('outOfStockOnly').optional().isBoolean().withMessage('outOfStockOnly must be boolean'),
    validate,
  ],
  inventoryReportsController.getCurrentStockStatus
);

// GET /api/reports/inventory/low-stock - Low Stock Alert
router.get(
  '/inventory/low-stock',
  [
    query('storeId').optional().isMongoId().withMessage('Invalid store ID'),
    query('categoryId').optional().isMongoId().withMessage('Invalid category ID'),
    validate,
  ],
  inventoryReportsController.getLowStockReport
);

// GET /api/reports/inventory/overstock - Overstock Report
router.get(
  '/inventory/overstock',
  [
    query('storeId').optional().isMongoId().withMessage('Invalid store ID'),
    query('categoryId').optional().isMongoId().withMessage('Invalid category ID'),
    validate,
  ],
  inventoryReportsController.getOverstockReport
);

// GET /api/reports/inventory/stock-movement - Stock Movement Report
router.get(
  '/inventory/stock-movement',
  [
    ...dateRangeValidation,
    query('productId').optional().isMongoId().withMessage('Invalid product ID'),
    query('storeId').optional().isMongoId().withMessage('Invalid store ID'),
    query('movementType').optional().isIn(['in', 'out', 'adjustment']).withMessage('Invalid movement type'),
    validate,
  ],
  inventoryReportsController.getStockMovement
);

// GET /api/reports/inventory/stock-valuation - Stock Valuation Report
router.get(
  '/inventory/stock-valuation',
  [
    query('storeId').optional().isMongoId().withMessage('Invalid store ID'),
    query('categoryId').optional().isMongoId().withMessage('Invalid category ID'),
    query('valuationMethod').optional().isIn(['fifo', 'average', 'lifo']).withMessage('Invalid valuation method'),
    validate,
  ],
  inventoryReportsController.getInventoryValuation
);

export default router;
