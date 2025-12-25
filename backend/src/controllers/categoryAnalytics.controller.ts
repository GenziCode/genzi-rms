import { Request, Response, NextFunction } from 'express';
import { CategoryAnalyticsService } from '../services/categoryAnalytics.service';
import { AppError } from '../utils/appError';

export class CategoryAnalyticsController {
  private analyticsService: CategoryAnalyticsService;

  constructor() {
    this.analyticsService = new CategoryAnalyticsService();
  }

  getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        throw new AppError('Tenant ID not found', 400);
      }
      const overview = await this.analyticsService.getOverview(tenantId);
      res.status(200).json({ success: true, data: overview });
    } catch (error) {
      next(error);
    }
  };

  getPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        throw new AppError('Tenant ID not found', 400);
      }
      const { startDate, endDate } = req.query;
      const performance = await this.analyticsService.getPerformance(
        tenantId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.status(200).json({ success: true, data: performance });
    } catch (error) {
      next(error);
    }
  };
}