import { Request, Response, NextFunction } from 'express';
import { POSService } from '../services/pos.service';
import { successResponse } from '../utils/response';
import { AppError } from '../utils/appError';

export class POSController {
  private posService: POSService;

  constructor() {
    this.posService = new POSService();
  }

  /**
   * Create a sale transaction
   * POST /api/sales
   */
  createSale = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;

      const sale = await this.posService.createSale(tenantId, userId, req.body);

      res
        .status(201)
        .json(successResponse(sale, 'Sale created successfully', 201));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Hold a transaction for later
   * POST /api/sales/hold
   */
  holdTransaction = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;

      const sale = await this.posService.holdTransaction(
        tenantId,
        userId,
        req.body
      );

      res
        .status(201)
        .json(successResponse(sale, 'Transaction held successfully', 201));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all held transactions
   * GET /api/sales/hold
   */
  getHeldTransactions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;

      const sales = await this.posService.getHeldTransactions(tenantId);

      res.json(
        successResponse(sales, 'Held transactions retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Resume a held transaction
   * POST /api/sales/resume/:id
   */
  resumeTransaction = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { id } = req.params;
      const { payments } = req.body;

      if (!payments || !Array.isArray(payments)) {
        throw new AppError('Payments array is required', 400);
      }

      const sale = await this.posService.resumeTransaction(
        tenantId,
        id,
        payments
      );

      res.json(
        successResponse(sale, 'Transaction resumed and completed successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all sales with filters
   * GET /api/sales
   */
  getSales = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const {
        storeId,
        cashierId,
        customerId,
        status,
        startDate,
        endDate,
        page,
        limit,
      } = req.query;

      const result = await this.posService.getSales(tenantId, {
        storeId: storeId as string,
        cashierId: cashierId as string,
        customerId: customerId as string,
        status: status as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json(
        successResponse(result, 'Sales retrieved successfully', 200, {
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
   * Get sale by ID
   * GET /api/sales/:id
   */
  getSaleById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { id } = req.params;

      const sale = await this.posService.getSaleById(tenantId, id);

      res.json(successResponse(sale, 'Sale retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Void a sale
   * POST /api/sales/:id/void
   */
  voidSale = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        throw new AppError('Void reason is required', 400);
      }

      const sale = await this.posService.voidSale(
        tenantId,
        id,
        userId,
        reason
      );

      res.json(successResponse(sale, 'Sale voided successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Refund a sale (full or partial)
   * POST /api/sales/:id/refund
   */
  refundSale = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { id } = req.params;
      const { amount, reason } = req.body;

      if (!amount || amount <= 0) {
        throw new AppError('Valid refund amount is required', 400);
      }

      if (!reason) {
        throw new AppError('Refund reason is required', 400);
      }

      const sale = await this.posService.refundSale(
        tenantId,
        id,
        userId,
        amount,
        reason
      );

      res.json(successResponse(sale, 'Sale refunded successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get daily sales summary
   * GET /api/sales/daily-summary
   */
  getDailySummary = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { storeId, date } = req.query;

      const summary = await this.posService.getDailySummary(
        tenantId,
        storeId as string,
        date ? new Date(date as string) : undefined
      );

      res.json(successResponse(summary, 'Daily summary retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };
}

