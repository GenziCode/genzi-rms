import { Request, Response, NextFunction } from 'express';
import { CategorySharingService } from '../services/categorySharing.service';
import { AppError } from '../utils/appError';

export class CategorySharingController {
  private sharingService: CategorySharingService;

  constructor() {
    this.sharingService = new CategorySharingService();
  }

  shareCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        throw new AppError('Tenant ID not found', 400);
      }
      const { categoryId } = req.params;
      const { targetTenantIds } = req.body;

      if (!targetTenantIds || !Array.isArray(targetTenantIds)) {
        throw new AppError('targetTenantIds must be an array of tenant IDs.', 400);
      }

      const category = await this.sharingService.shareCategoryWithTenants(tenantId, categoryId, targetTenantIds);
      res.status(200).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  };

  makeCategoryPublic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        throw new AppError('Tenant ID not found', 400);
      }
      const { categoryId } = req.params;

      const category = await this.sharingService.makeCategoryPublic(tenantId, categoryId);
      res.status(200).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  };

  revokeSharing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        throw new AppError('Tenant ID not found', 400);
      }
      const { categoryId } = req.params;
      const { targetTenantIds } = req.body;

      if (!targetTenantIds || !Array.isArray(targetTenantIds)) {
        throw new AppError('targetTenantIds must be an array of tenant IDs.', 400);
      }

      const category = await this.sharingService.revokeSharing(tenantId, categoryId, targetTenantIds);
      res.status(200).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  };
  
  getSharedCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        throw new AppError('Tenant ID not found', 400);
      }
      
      const categories = await this.sharingService.getSharedCategories(tenantId);
      res.status(200).json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  };
}