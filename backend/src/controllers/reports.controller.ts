import { Request, Response, NextFunction } from 'express';
import { TenantRequest } from '../types';
import { ReportsService } from '../services/reports.service';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

const reportsService = new ReportsService();

export class ReportsController {
  /**
   * Get dashboard KPIs
   */
  getDashboard = async (req: TenantRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { period = 'today' } = req.query as { period?: string };
      const tenantId = req.tenant?.id;
      
      if (!tenantId) {
        sendError(res, 'Tenant not specified', 400, 'TENANT_NOT_SPECIFIED');
        return;
      }

      // Check if subscription is expired
      const isSubscriptionExpired = req.tenant?.subscription?.status === 'expired';
      
      const dashboard = await reportsService.getDashboard(
        tenantId, 
        period as 'today' | 'week' | 'month', 
        isSubscriptionExpired
      );

      sendSuccess(res, dashboard, 'Dashboard data retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get sales trends
   */
  getSalesTrends = async (req: TenantRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const tenantId = req.tenant?.id;

      if (!tenantId) {
        return sendError(res, 'Tenant not specified', 400, 'TENANT_NOT_SPECIFIED');
      }

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // Check if subscription is expired
      const isSubscriptionExpired = req.tenant?.subscription?.status === 'expired';

      const trends = await reportsService.getSalesTrends(tenantId, start, end, isSubscriptionExpired);

      sendSuccess(res, trends, 'Sales trends retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get top selling products
   */
  getTopProducts = async (req: TenantRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate, limit = '10' } = req.query as { startDate?: string; endDate?: string; limit?: string };
      const tenantId = req.tenant?.id;

      if (!tenantId) {
        return sendError(res, 'Tenant not specified', 400, 'TENANT_NOT_SPECIFIED');
      }

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      const limitNum = parseInt(limit, 10) || 10;

      const topProducts = await reportsService.getTopProducts(tenantId, start, end, limitNum);

      sendSuccess(res, topProducts, 'Top products retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get payment methods report
   */
  getPaymentMethods = async (req: TenantRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const tenantId = req.tenant?.id;

      if (!tenantId) {
        sendError(res, 'Tenant not specified', 400, 'TENANT_NOT_SPECIFIED');
        return;
      }

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const paymentMethods = await reportsService.getPaymentMethodsReport(tenantId, start, end);

      sendSuccess(res, paymentMethods, 'Payment methods report retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get profit & loss report
   */
  getProfitLoss = async (req: TenantRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const tenantId = req.tenant?.id;

      if (!tenantId) {
        sendError(res, 'Tenant not specified', 400, 'TENANT_NOT_SPECIFIED');
        return;
      }

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const profitLoss = await reportsService.getProfitLoss(tenantId, start, end);

      sendSuccess(res, profitLoss, 'Profit & loss report retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get inventory valuation
   */
  getInventoryValuation = async (req: TenantRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant?.id;

      if (!tenantId) {
        sendError(res, 'Tenant not specified', 400, 'TENANT_NOT_SPECIFIED');
        return;
      }

      const valuation = await reportsService.getInventoryValuation(tenantId);

      sendSuccess(res, valuation, 'Inventory valuation retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get customer insights
   */
  getCustomerInsights = async (req: TenantRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const tenantId = req.tenant?.id;

      if (!tenantId) {
        sendError(res, 'Tenant not specified', 400, 'TENANT_NOT_SPECIFIED');
        return;
      }

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const insights = await reportsService.getCustomerInsights(tenantId, start, end);

      sendSuccess(res, insights, 'Customer insights retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get vendor performance
   */
  getVendorPerformance = async (req: TenantRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const tenantId = req.tenant?.id;

      if (!tenantId) {
        sendError(res, 'Tenant not specified', 400, 'TENANT_NOT_SPECIFIED');
        return;
      }

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const performance = await reportsService.getVendorPerformance(tenantId, start, end);

      sendSuccess(res, performance, 'Vendor performance retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const reportsController = new ReportsController();
