import { Request, Response, NextFunction } from 'express';
import { CategoryAccessService } from '../services/categoryAccess.service';
import { AppError } from '../utils/appError';
import { UserRole } from '../types';

export class CategoryAccessController {
  private accessService: CategoryAccessService;

  constructor() {
    this.accessService = new CategoryAccessService();
  }

  setRolePermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        throw new AppError('Tenant ID not found', 400);
      }
      const { categoryId } = req.params;
      const { role, permissions } = req.body;

      if (!role || !permissions) {
        throw new AppError('Role and permissions are required.', 400);
      }

      const category = await this.accessService.setRolePermissions(tenantId, categoryId, role as UserRole, permissions);
      res.status(200).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  };

  setUserPermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        throw new AppError('Tenant ID not found', 400);
      }
      const { categoryId, userId } = req.params;
      const { permissions } = req.body;

      if (!permissions) {
        throw new AppError('Permissions are required.', 400);
      }

      const category = await this.accessService.setUserPermissions(tenantId, categoryId, userId, permissions);
      res.status(200).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  };

  checkPermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant?.id;
      const userId = req.user?.id;
      const userRole = req.user?.role as UserRole;

      if (!tenantId || !userId || !userRole) {
        throw new AppError('User or tenant context not found', 400);
      }

      const { categoryId, permission } = req.params;
      
      const hasPermission = await this.accessService.checkPermission(tenantId, userId, userRole, categoryId, permission);
      res.status(200).json({ success: true, data: { hasPermission } });
    } catch (error) {
      next(error);
    }
  };
}