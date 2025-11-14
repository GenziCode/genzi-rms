import { Request, Response, NextFunction } from 'express';
import { TenantRequest } from '../types';
import { inventoryReportsService } from '../services/reports/inventoryReports.service';
import { successResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

/**
 * Inventory Reports Controller
 * Handles all inventory-related report endpoints
 */
export class InventoryReportsController {
  /**
   * Current Stock Status Report
   * GET /api/reports/inventory/current-stock
   */
  getCurrentStockStatus = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { storeId, categoryId, lowStockOnly, outOfStockOnly } = req.query;

    const filters: any = {};
    if (storeId) filters.storeId = storeId as string;
    if (categoryId) filters.categoryId = categoryId as string;
    if (lowStockOnly) filters.lowStockOnly = lowStockOnly === 'true';
    if (outOfStockOnly) filters.outOfStockOnly = outOfStockOnly === 'true';

    const result = await inventoryReportsService.getCurrentStockStatus(tenantId, filters);
    res.json(successResponse(result, 'Current stock status retrieved successfully'));
  });

  /**
   * Low Stock Alert Report
   * GET /api/reports/inventory/low-stock
   */
  getLowStockAlert = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { storeId, categoryId } = req.query;

    const filters: any = {};
    if (storeId) filters.storeId = storeId as string;
    if (categoryId) filters.categoryId = categoryId as string;

    const result = await inventoryReportsService.getLowStockAlert(tenantId, filters);
    res.json(successResponse(result, 'Low stock alert retrieved successfully'));
  });

  /**
   * Overstock Report
   * GET /api/reports/inventory/overstock
   */
  getOverstockReport = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { storeId, categoryId } = req.query;

    const filters: any = {};
    if (storeId) filters.storeId = storeId as string;
    if (categoryId) filters.categoryId = categoryId as string;

    const result = await inventoryReportsService.getOverstockReport(tenantId, filters);
    res.json(successResponse(result, 'Overstock report retrieved successfully'));
  });

  /**
   * Stock Movement Report
   * GET /api/reports/inventory/stock-movement
   */
  getStockMovement = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { startDate, endDate, productId, storeId, movementType } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (productId) filters.productId = productId as string;
    if (storeId) filters.storeId = storeId as string;
    if (movementType) filters.movementType = movementType as 'in' | 'out' | 'adjustment';

    const result = await inventoryReportsService.getStockMovement(tenantId, filters);
    res.json(successResponse(result, 'Stock movement report retrieved successfully'));
  });

  /**
   * Stock Valuation Report
   * GET /api/reports/inventory/stock-valuation
   */
  getStockValuation = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { storeId, categoryId, valuationMethod } = req.query;

    const filters: any = {};
    if (storeId) filters.storeId = storeId as string;
    if (categoryId) filters.categoryId = categoryId as string;
    if (valuationMethod) filters.valuationMethod = valuationMethod as 'fifo' | 'average' | 'lifo';

    const result = await inventoryReportsService.getStockValuation(tenantId, filters);
    res.json(successResponse(result, 'Stock valuation report retrieved successfully'));
  });
}

export const inventoryReportsController = new InventoryReportsController();

