import { Request, Response, NextFunction } from 'express';
import { PurchaseOrderService } from '../services/purchaseOrder.service';
import { successResponse } from '../utils/response';
import { AppError } from '../utils/appError';

export class PurchaseOrderController {
  private poService: PurchaseOrderService;

  constructor() {
    this.poService = new PurchaseOrderService();
  }

  createPO = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const po = await this.poService.createPurchaseOrder(req.tenant!.id, req.user!.id, req.body);
      res.status(201).json(successResponse(po, 'Purchase order created successfully', 201));
    } catch (error) {
      next(error);
    }
  };

  getPOs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { vendorId, storeId, status, startDate, endDate, search, page, limit } = req.query;
      
      // Build search query if provided
      let searchQuery: any = {};
      if (search) {
        searchQuery = {
          $or: [
            { poNumber: { $regex: search as string, $options: 'i' } },
            { 'vendor.name': { $regex: search as string, $options: 'i' } },
            { 'vendor.company': { $regex: search as string, $options: 'i' } },
            { 'items.name': { $regex: search as string, $options: 'i' } },
          ],
        };
      }
      
      const result = await this.poService.getPurchaseOrders(req.tenant!.id, {
        vendorId: vendorId as string,
        storeId: storeId as string,
        status: status as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        search: Object.keys(searchQuery).length > 0 ? searchQuery : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(successResponse(result, 'Purchase orders retrieved successfully', 200, {
        pagination: { page: result.page, limit: req.query.limit ? parseInt(req.query.limit as string) : 50, total: result.total, totalPages: result.totalPages },
      }));
    } catch (error) {
      next(error);
    }
  };

  getPOById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const po = await this.poService.getPOById(req.tenant!.id, req.params.id);
      res.json(successResponse(po, 'Purchase order retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  sendPO = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const po = await this.poService.sendPO(req.tenant!.id, req.params.id, req.user!.id);
      res.json(successResponse(po, 'Purchase order sent successfully'));
    } catch (error) {
      next(error);
    }
  };

  receiveGoods = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const po = await this.poService.receiveGoods(req.tenant!.id, req.params.id, req.user!.id, req.body);
      res.json(successResponse(po, 'Goods received successfully'));
    } catch (error) {
      next(error);
    }
  };

  cancelPO = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reason } = req.body;
      if (!reason) {
        throw new AppError('Cancellation reason is required', 400);
      }
      const po = await this.poService.cancelPO(req.tenant!.id, req.params.id, req.user!.id, reason);
      res.json(successResponse(po, 'Purchase order cancelled successfully'));
    } catch (error) {
      next(error);
    }
  };

  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      const dateRange = startDate && endDate
        ? {
            start: new Date(startDate as string),
            end: new Date(endDate as string),
          }
        : undefined;
      const stats = await this.poService.getPOStats(req.tenant!.id, dateRange);
      res.json(successResponse(stats, 'Purchase order statistics retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };
}

