import { Response } from 'express';
import { body, query, param } from 'express-validator';
import { asyncHandler } from '../middleware/error.middleware';
import { TenantRequest } from '../types';
import { inventoryForecastService } from '../services/inventoryForecast.service';
import { validate } from '../middleware/validation.middleware';
import { successResponse } from '../utils/response';

export const listForecastValidations = [
  query('storeId').optional().isMongoId(),
  query('lookbackDays').optional().isInt({ min: 7, max: 365 }),
  query('minVelocity').optional().isFloat({ min: 0 }),
  query('limit').optional().isInt({ min: 1, max: 500 }),
  validate,
];

export const overrideValidations = [
  param('productId').isMongoId().withMessage('Invalid product ID'),
  body('leadTimeDays').optional().isFloat({ min: 0 }),
  body('safetyStockDays').optional().isFloat({ min: 0 }),
  body('notes').optional().isString(),
  validate,
];

export class InventoryForecastController {
  listForecasts = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const data = await inventoryForecastService.getForecasts(tenantId, {
      storeId: req.query.storeId as string,
      lookbackDays: req.query.lookbackDays ? Number(req.query.lookbackDays) : undefined,
      minVelocity: req.query.minVelocity ? Number(req.query.minVelocity) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json(successResponse(data, 'Forecast data ready'));
  });

  updateOverride = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id: userId } = req.user!;
    const override = await inventoryForecastService.upsertOverride(
      tenantId,
      req.params.productId,
      req.body,
      userId
    );
    res.json(successResponse(override, 'Forecast override saved'));
  });
}

