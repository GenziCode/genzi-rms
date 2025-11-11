import { Request, Response, NextFunction } from 'express';
import { ExportService } from '../services/export.service';
import { logger } from '../utils/logger';

export class ExportController {
  private exportService: ExportService;

  constructor() {
    this.exportService = new ExportService();
  }

  /**
   * Export products to CSV
   * GET /api/export/products
   */
  exportProducts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;

      const csv = await this.exportService.exportProducts(tenantId);

      const filename = `products-${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send('\uFEFF' + csv); // BOM for Excel compatibility
    } catch (error) {
      next(error);
    }
  };

  /**
   * Export sales to CSV
   * GET /api/export/sales
   */
  exportSales = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { startDate, endDate } = req.query;

      const csv = await this.exportService.exportSales(
        tenantId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      const filename = `sales-${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send('\uFEFF' + csv);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Export customers to CSV
   * GET /api/export/customers
   */
  exportCustomers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;

      const csv = await this.exportService.exportCustomers(tenantId);

      const filename = `customers-${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send('\uFEFF' + csv);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Export inventory movements to CSV
   * GET /api/export/inventory-movements
   */
  exportInventoryMovements = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { startDate, endDate } = req.query;

      const csv = await this.exportService.exportInventoryMovements(
        tenantId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      const filename = `inventory-movements-${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send('\uFEFF' + csv);
    } catch (error) {
      next(error);
    }
  };
}

