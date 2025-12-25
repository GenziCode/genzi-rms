import { Response } from 'express';
import { TenantRequest } from '../types';
import { salesReportsService } from '../services/reports/salesReports.service';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';
import moment from 'moment-timezone';

/**
 * Sales Reports Controller
 * Handles all sales-related report endpoints
 */
export class SalesReportsController {
  /**
   * Daily Sales Summary Report
   * GET /api/reports/sales/daily-summary
   */
  getDailySalesSummary = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { startDate, endDate, storeId } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = moment(startDate as string).toDate();
    if (endDate) filters.endDate = moment(endDate as string).toDate();
    if (storeId) filters.storeId = storeId as string;

    const result = await salesReportsService.getDailySalesSummary(tenantId, filters);
    res.json(successResponse(result, 'Daily sales summary retrieved successfully'));
  });

  /**
   * Weekly Sales Report
   * GET /api/reports/sales/weekly
   */
  getWeeklySales = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { weekStart, weekEnd, storeId } = req.query;

    const filters: any = {};
    if (weekStart) filters.weekStart = moment(weekStart as string).toDate();
    if (weekEnd) filters.weekEnd = moment(weekEnd as string).toDate();
    if (storeId) filters.storeId = storeId as string;

    const result = await salesReportsService.getWeeklySales(tenantId, filters);
    res.json(successResponse(result, 'Weekly sales report retrieved successfully'));
  });

  /**
   * Monthly Sales Report
   * GET /api/reports/sales/monthly
   */
  getMonthlySales = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { month, year, storeId } = req.query;

    const filters: any = {};
    if (month) filters.month = parseInt(month as string);
    if (year) filters.year = parseInt(year as string);
    if (storeId) filters.storeId = storeId as string;

    const result = await salesReportsService.getMonthlySales(tenantId, filters);
    res.json(successResponse(result, 'Monthly sales report retrieved successfully'));
  });

  /**
   * Sales by Product Report
   * GET /api/reports/sales/by-product
   */
  getSalesByProduct = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { startDate, endDate, productId, storeId } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = moment(startDate as string).toDate();
    if (endDate) filters.endDate = moment(endDate as string).toDate();
    if (productId) filters.productId = productId as string;
    if (storeId) filters.storeId = storeId as string;

    const result = await salesReportsService.getSalesByProduct(tenantId, filters);
    res.json(successResponse(result, 'Sales by product report retrieved successfully'));
  });

  /**
   * Sales by Category Report
   * GET /api/reports/sales/by-category
   */
  getSalesByCategory = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { startDate, endDate, categoryId, storeId } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = moment(startDate as string).toDate();
    if (endDate) filters.endDate = moment(endDate as string).toDate();
    if (categoryId) filters.categoryId = categoryId as string;
    if (storeId) filters.storeId = storeId as string;

    const result = await salesReportsService.getSalesByCategory(tenantId, filters);
    res.json(successResponse(result, 'Sales by category report retrieved successfully'));
  });

  /**
   * Sales by Store Report
   * GET /api/reports/sales/by-store
   */
  getSalesByStore = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { startDate, endDate, storeIds } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = moment(startDate as string).toDate();
    if (endDate) filters.endDate = moment(endDate as string).toDate();
    if (storeIds) {
      filters.storeIds = Array.isArray(storeIds) ? storeIds : [storeIds];
    }

    const result = await salesReportsService.getSalesByStore(tenantId, filters);
    res.json(successResponse(result, 'Sales by store report retrieved successfully'));
  });

  /**
   * Sales by Employee/Cashier Report
   * GET /api/reports/sales/by-employee
   */
  getSalesByEmployee = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { startDate, endDate, employeeId, storeId } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = moment(startDate as string).toDate();
    if (endDate) filters.endDate = moment(endDate as string).toDate();
    if (employeeId) filters.employeeId = employeeId as string;
    if (storeId) filters.storeId = storeId as string;

    const result = await salesReportsService.getSalesByEmployee(tenantId, filters);
    res.json(successResponse(result, 'Sales by employee report retrieved successfully'));
  });

  /**
   * Sales by Customer Report
   * GET /api/reports/sales/by-customer
   */
  getSalesByCustomer = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { startDate, endDate, customerId, storeId, limit } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = moment(startDate as string).toDate();
    if (endDate) filters.endDate = moment(endDate as string).toDate();
    if (customerId) filters.customerId = customerId as string;
    if (storeId) filters.storeId = storeId as string;
    if (limit) filters.limit = parseInt(limit as string);

    const result = await salesReportsService.getSalesByCustomer(tenantId, filters);
    res.json(successResponse(result, 'Sales by customer report retrieved successfully'));
  });

  /**
   * Sales Comparison Report
   * GET /api/reports/sales/comparison
   */
  getSalesComparison = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { period1Start, period1End, period2Start, period2End, storeId } = req.query;

    if (!period1Start || !period1End || !period2Start || !period2End) {
      return res.status(400).json({
        success: false,
        error: { message: 'All period dates are required' },
      });
    }

    const filters = {
      period1Start: moment(period1Start as string).toDate(),
      period1End: moment(period1End as string).toDate(),
      period2Start: moment(period2Start as string).toDate(),
      period2End: moment(period2End as string).toDate(),
      storeId: storeId as string | undefined,
    };

    const result = await salesReportsService.getSalesComparison(tenantId, filters);
    res.json(successResponse(result, 'Sales comparison report retrieved successfully'));
  });

  /**
   * Top Selling Products Report
   * GET /api/reports/sales/top-products
   */
  getTopSellingProducts = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { startDate, endDate, limit, sortBy, storeId } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = moment(startDate as string).toDate();
    if (endDate) filters.endDate = moment(endDate as string).toDate();
    if (limit) filters.limit = parseInt(limit as string);
    if (sortBy) filters.sortBy = sortBy as 'revenue' | 'quantity' | 'transactions';
    if (storeId) filters.storeId = storeId as string;

    const result = await salesReportsService.getTopSellingProducts(tenantId, filters);
    res.json(successResponse(result, 'Top selling products report retrieved successfully'));
  });

  /**
   * Bottom Selling Products Report
   * GET /api/reports/sales/bottom-products
   */
  getBottomSellingProducts = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { startDate, endDate, limit, sortBy, storeId } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = moment(startDate as string).toDate();
    if (endDate) filters.endDate = moment(endDate as string).toDate();
    if (limit) filters.limit = parseInt(limit as string);
    if (sortBy) filters.sortBy = sortBy as 'revenue' | 'quantity' | 'transactions';
    if (storeId) filters.storeId = storeId as string;

    const result = await salesReportsService.getBottomSellingProducts(tenantId, filters);
    res.json(successResponse(result, 'Bottom selling products report retrieved successfully'));
  });

  /**
   * Sales Trend Analysis Report
   * GET /api/reports/sales/trend-analysis
   */
  getSalesTrendAnalysis = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { startDate, endDate, period, storeId } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = moment(startDate as string).toDate();
    if (endDate) filters.endDate = moment(endDate as string).toDate();
    if (period) filters.period = period as 'day' | 'week' | 'month';
    if (storeId) filters.storeId = storeId as string;

    const result = await salesReportsService.getSalesTrendAnalysis(tenantId, filters);
    res.json(successResponse(result, 'Sales trend analysis retrieved successfully'));
  });

  /**
   * Discount Analysis Report
   * GET /api/reports/sales/discount-analysis
   */
  getDiscountAnalysis = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { startDate, endDate, storeId } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = moment(startDate as string).toDate();
    if (endDate) filters.endDate = moment(endDate as string).toDate();
    if (storeId) filters.storeId = storeId as string;

    const result = await salesReportsService.getDiscountAnalysis(tenantId, filters);
    res.json(successResponse(result, 'Discount analysis retrieved successfully'));
  });

  /**
   * Return/Refund Report
   * GET /api/reports/sales/returns-refunds
   */
  getReturnRefundReport = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { startDate, endDate, storeId } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = moment(startDate as string).toDate();
    if (endDate) filters.endDate = moment(endDate as string).toDate();
    if (storeId) filters.storeId = storeId as string;

    const result = await salesReportsService.getReturnRefundReport(tenantId, filters);
    res.json(successResponse(result, 'Return/refund report retrieved successfully'));
  });

  /**
   * Sales Forecast Report
   * GET /api/reports/sales/forecast
   */
  getSalesForecast = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { forecastDays, storeId } = req.query;

    const filters: any = {};
    if (forecastDays) filters.forecastDays = parseInt(forecastDays as string);
    if (storeId) filters.storeId = storeId as string;

    const result = await salesReportsService.getSalesForecast(tenantId, filters);
    res.json(successResponse(result, 'Sales forecast retrieved successfully'));
  });
}

export const salesReportsController = new SalesReportsController();

