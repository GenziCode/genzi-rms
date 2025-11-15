import { Response } from 'express';
import { query } from 'express-validator';
import { asyncHandler } from '../middleware/error.middleware';
import { TenantRequest } from '../types';
import { stockAnalyticsService } from '../services/analytics/stockAnalytics.service';
import { validate } from '../middleware/validation.middleware';
import { successResponse } from '../utils/response';

const analyticsValidations = [
  query('storeId').optional().isMongoId(),
  query('categoryId').optional().isMongoId(),
  query('lookbackDays').optional().isInt({ min: 7, max: 365 }),
  query('limit').optional().isInt({ min: 1, max: 200 }),
  validate,
];

export class StockAnalyticsController {
  getAging = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const buckets = await stockAnalyticsService.getAgingBuckets(tenantId, {
      storeId: req.query.storeId as string,
      categoryId: req.query.categoryId as string,
    });
    res.json(successResponse(buckets, 'Aging buckets ready'));
  });

  getTurnover = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const turnover = await stockAnalyticsService.getTurnover(tenantId, {
      storeId: req.query.storeId as string,
      lookbackDays: req.query.lookbackDays ? Number(req.query.lookbackDays) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json(successResponse(turnover, 'Turnover report ready'));
  });

  getCongestion = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const congestion = await stockAnalyticsService.getCongestion(tenantId, {
      storeId: req.query.storeId as string,
      lookbackDays: req.query.lookbackDays ? Number(req.query.lookbackDays) : undefined,
    });
    res.json(successResponse(congestion, 'Congestion report ready'));
  });
}

export const stockAnalyticsValidations = {
  aging: analyticsValidations,
  turnover: analyticsValidations,
  congestion: analyticsValidations,
};

