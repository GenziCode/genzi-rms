import { Request, Response, NextFunction } from 'express';
import { SyncService } from '../services/sync.service';
import { successResponse } from '../utils/response';
import { AppError } from '../utils/appError';

export class SyncController {
  private syncService: SyncService;

  constructor() {
    this.syncService = new SyncService();
  }

  /**
   * Pull data for offline cache
   * POST /api/sync/pull
   */
  pullData = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { lastSync } = req.body;

      const data = await this.syncService.pullData(
        tenantId,
        lastSync ? new Date(lastSync) : undefined
      );

      res.json(successResponse(data, 'Data pulled successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Push offline sales
   * POST /api/sync/push
   */
  pushSales = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { sales } = req.body;

      if (!Array.isArray(sales)) {
        throw new AppError('Sales must be an array', 400);
      }

      const results = await this.syncService.pushSales(tenantId, userId, sales);

      res.json(successResponse(results, 'Offline sales synced'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get sync status
   * GET /api/sync/status/:deviceId
   */
  getSyncStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { deviceId } = req.params;

      const status = await this.syncService.getSyncStatus(tenantId, deviceId);

      res.json(successResponse(status, 'Sync status retrieved'));
    } catch (error) {
      next(error);
    }
  };
}

