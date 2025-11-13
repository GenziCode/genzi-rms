import { Response, NextFunction } from 'express';
import { TenantRequest } from '../types';
import { storeService } from '../services/store.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export class StoreController {
  list = asyncHandler(async (req: TenantRequest, res: Response) => {
    const stores = await storeService.list(req.user!.tenantId);
    sendSuccess(res, { stores }, 'Stores retrieved successfully');
  });

  getById = asyncHandler(async (req: TenantRequest, res: Response) => {
    const store = await storeService.getById(req.user!.tenantId, req.params.id);
    sendSuccess(res, store, 'Store retrieved successfully');
  });

  create = asyncHandler(async (req: TenantRequest, res: Response) => {
    const store = await storeService.create(req.user!.tenantId, req.body);
    sendSuccess(res, store, 'Store created successfully', 201);
  });

  update = asyncHandler(async (req: TenantRequest, res: Response) => {
    const store = await storeService.update(req.user!.tenantId, req.params.id, req.body);
    sendSuccess(res, store, 'Store updated successfully');
  });

  delete = asyncHandler(async (req: TenantRequest, res: Response) => {
    await storeService.delete(req.user!.tenantId, req.params.id);
    sendSuccess(res, null, 'Store deleted successfully');
  });
}

export const storeController = new StoreController();


