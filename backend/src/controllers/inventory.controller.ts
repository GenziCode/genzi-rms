import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventory.service';
import { successResponse } from '../utils/response';
import { AppError } from '../utils/appError';

export class InventoryController {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  /**
   * Adjust stock manually
   * POST /api/inventory/adjust
   */
  adjustStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;

      const product = await this.inventoryService.adjustStock(tenantId, userId, req.body);

      res.json(successResponse(product, 'Stock adjusted successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Transfer stock between stores
   * POST /api/inventory/transfer
   */
  transferStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;

      const result = await this.inventoryService.transferStock(tenantId, userId, req.body);

      res.json(successResponse(result, 'Stock transferred successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get stock movement history
   * GET /api/inventory/movements
   */
  getMovements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { productId, storeId, type, startDate, endDate, page, limit } = req.query;

      const result = await this.inventoryService.getMovementHistory(tenantId, {
        productId: productId as string,
        storeId: storeId as string,
        type: type as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json(
        successResponse(result, 'Movement history retrieved successfully', 200, {
          pagination: {
            page: result.page,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
            total: result.total,
            totalPages: result.totalPages,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get active stock alerts
   * GET /api/inventory/alerts
   */
  getAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { type, storeId, status } = req.query;

      const alerts = await this.inventoryService.getActiveAlerts(tenantId, {
        type: type as string,
        storeId: storeId as string,
        status: status as string,
      });

      res.json(successResponse(alerts, 'Alerts retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Acknowledge an alert
   * POST /api/inventory/alerts/:id/acknowledge
   */
  acknowledgeAlert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { id } = req.params;

      const alert = await this.inventoryService.acknowledgeAlert(tenantId, id, userId);

      res.json(successResponse(alert, 'Alert acknowledged successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get inventory valuation
   * GET /api/inventory/valuation
   */
  getValuation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { storeId } = req.query;

      const valuation = await this.inventoryService.getInventoryValuation(
        tenantId,
        storeId as string
      );

      res.json(successResponse(valuation, 'Inventory valuation retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get low stock products
   * GET /api/inventory/low-stock
   */
  getLowStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { storeId } = req.query;

      const products = await this.inventoryService.getLowStockProducts(tenantId, storeId as string);

      res.json(successResponse(products, 'Low stock products retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get inventory status summary
   * GET /api/inventory/status
   */
  getStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { storeId } = req.query;

      const status = await this.inventoryService.getInventoryStatus(tenantId, storeId as string);

      res.json(successResponse(status, 'Inventory status retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };
}
