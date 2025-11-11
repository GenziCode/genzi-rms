import { Request, Response, NextFunction } from 'express';
import { ReportsService } from '../services/reports.service';
import { successResponse } from '../utils/response';
import moment from 'moment-timezone';

export class ReportsController {
  private reportsService: ReportsService;

  constructor() {
    this.reportsService = new ReportsService();
  }

  /**
   * Get dashboard KPIs
   * GET /api/reports/dashboard
   */
  getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const period = (req.query.period as 'today' | 'week' | 'month') || 'today';

      const dashboard = await this.reportsService.getDashboard(tenantId, period);

      res.json(successResponse(dashboard, 'Dashboard data retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get sales trends
   * GET /api/reports/sales-trends
   */
  getSalesTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { startDate, endDate } = req.query;

      const start = startDate
        ? moment(startDate as string).toDate()
        : moment().subtract(30, 'days').toDate();
      const end = endDate ? moment(endDate as string).toDate() : moment().toDate();

      const trends = await this.reportsService.getSalesTrends(tenantId, start, end);

      res.json(
        successResponse(trends, 'Sales trends retrieved successfully', 200, {
          dateRange: { start, end },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get top selling products
   * GET /api/reports/top-products
   */
  getTopProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { startDate, endDate, limit } = req.query;

      const start = startDate
        ? moment(startDate as string).toDate()
        : moment().subtract(30, 'days').toDate();
      const end = endDate ? moment(endDate as string).toDate() : moment().toDate();
      const limitNum = limit ? parseInt(limit as string) : 10;

      const topProducts = await this.reportsService.getTopProducts(tenantId, start, end, limitNum);

      res.json(
        successResponse(topProducts, 'Top products retrieved successfully', 200, {
          dateRange: { start, end },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get payment methods report
   * GET /api/reports/payment-methods
   */
  getPaymentMethods = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { startDate, endDate } = req.query;

      const start = startDate
        ? moment(startDate as string).toDate()
        : moment().subtract(30, 'days').toDate();
      const end = endDate ? moment(endDate as string).toDate() : moment().toDate();

      const paymentMethods = await this.reportsService.getPaymentMethodsReport(
        tenantId,
        start,
        end
      );

      res.json(
        successResponse(paymentMethods, 'Payment methods report retrieved successfully', 200, {
          dateRange: { start, end },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get profit & loss report
   * GET /api/reports/profit-loss
   */
  getProfitLoss = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { startDate, endDate } = req.query;

      const start = startDate
        ? moment(startDate as string).toDate()
        : moment().subtract(30, 'days').toDate();
      const end = endDate ? moment(endDate as string).toDate() : moment().toDate();

      const profitLoss = await this.reportsService.getProfitLoss(tenantId, start, end);

      res.json(successResponse(profitLoss, 'Profit & loss report retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get inventory valuation
   * GET /api/reports/inventory-valuation
   */
  getInventoryValuation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;

      const valuation = await this.reportsService.getInventoryValuation(tenantId);

      res.json(successResponse(valuation, 'Inventory valuation retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get customer insights
   * GET /api/reports/customer-insights
   */
  getCustomerInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { startDate, endDate } = req.query;

      const start = startDate
        ? moment(startDate as string).toDate()
        : moment().subtract(30, 'days').toDate();
      const end = endDate ? moment(endDate as string).toDate() : moment().toDate();

      const insights = await this.reportsService.getCustomerInsights(tenantId, start, end);

      res.json(successResponse(insights, 'Customer insights retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get vendor performance
   * GET /api/reports/vendor-performance
   */
  getVendorPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { startDate, endDate } = req.query;

      const start = startDate
        ? moment(startDate as string).toDate()
        : moment().subtract(30, 'days').toDate();
      const end = endDate ? moment(endDate as string).toDate() : moment().toDate();

      const performance = await this.reportsService.getVendorPerformance(tenantId, start, end);

      res.json(
        successResponse(performance, 'Vendor performance retrieved successfully', 200, {
          dateRange: { start, end },
        })
      );
    } catch (error) {
      next(error);
    }
  };
}
