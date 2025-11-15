import { Response } from 'express';
import moment from 'moment-timezone';
import { TenantRequest } from '../types';
import { asyncHandler } from '../middleware/error.middleware';
import { successResponse } from '../utils/response';
import { inventoryReportsService } from '../services/reports/inventoryReports.service';

export class InventoryReportsController {
  getCurrentStockStatus = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { storeId, categoryId } = req.query;

    const filters = {
      storeId: storeId as string | undefined,
      categoryId: categoryId as string | undefined,
    };

    const result = await inventoryReportsService.getCurrentStockStatus(tenantId, filters);
    res.json(successResponse(result, 'Current stock status retrieved successfully'));
  });

  getLowStockReport = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { storeId, categoryId, threshold } = req.query;

    const filters = {
      storeId: storeId as string | undefined,
      categoryId: categoryId as string | undefined,
      threshold: threshold ? parseInt(threshold as string, 10) : undefined,
    };

    const result = await inventoryReportsService.getLowStockReport(tenantId, filters);
    res.json(successResponse(result, 'Low stock report retrieved successfully'));
  });

  getOverstockReport = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { storeId, categoryId, threshold } = req.query;

    const filters = {
      storeId: storeId as string | undefined,
      categoryId: categoryId as string | undefined,
      threshold: threshold ? parseInt(threshold as string, 10) : undefined,
    };

    const result = await inventoryReportsService.getOverstockReport(tenantId, filters);
    res.json(successResponse(result, 'Overstock report retrieved successfully'));
  });

  getInventoryValuation = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { storeId, categoryId } = req.query;

    const filters = {
      storeId: storeId as string | undefined,
      categoryId: categoryId as string | undefined,
    };

    const result = await inventoryReportsService.getInventoryValuation(tenantId, filters);
    res.json(successResponse(result, 'Inventory valuation retrieved successfully'));
  });

  getStockMovement = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { storeId, productId, startDate, endDate, type } = req.query;

    const filters = {
      storeId: storeId as string | undefined,
      productId: productId as string | undefined,
      type: type as string | undefined,
      startDate: startDate ? moment(startDate as string).toDate() : undefined,
      endDate: endDate ? moment(endDate as string).toDate() : undefined,
    };

    const result = await inventoryReportsService.getStockMovement(tenantId, filters);
    res.json(successResponse(result, 'Stock movement report retrieved successfully'));
  });
}

export const inventoryReportsController = new InventoryReportsController();

