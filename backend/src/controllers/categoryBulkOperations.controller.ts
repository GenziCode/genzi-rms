import { Response, NextFunction } from 'express';
import { TenantRequest } from '../types';
import { CategoryBulkOperationsService } from '../services/categoryBulkOperations.service';
import { successResponse } from '../utils/response';
import { AppError } from '../utils/appError';

export class CategoryBulkOperationsController {
  private categoryBulkOperationsService: CategoryBulkOperationsService;

  constructor() {
    this.categoryBulkOperationsService = new CategoryBulkOperationsService();
  }

  /**
   * Bulk update categories
   * POST /api/categories/bulk-update
   */
  bulkUpdate = async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { categoryIds, updateData } = req.body;

      if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        throw new AppError('Category IDs must be a non-empty array', 400);
      }

      if (!updateData || typeof updateData !== 'object') {
        throw new AppError('Update data is required', 400);
      }

      const result = await this.categoryBulkOperationsService.bulkUpdate(
        tenantId,
        userId,
        categoryIds,
        updateData
      );

      res.json(
        successResponse(result, 'Categories updated successfully', 200, {
          bulkOperation: {
            processed: result.processed,
            successCount: result.successCount,
            errorCount: result.errorCount,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk activate categories
   * POST /api/categories/bulk-activate
   */
  bulkActivate = async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { categoryIds } = req.body;

      if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        throw new AppError('Category IDs must be a non-empty array', 400);
      }

      const result = await this.categoryBulkOperationsService.bulkActivate(
        tenantId,
        userId,
        categoryIds
      );

      res.json(
        successResponse(result, 'Categories activated successfully', 200, {
          bulkOperation: {
            processed: result.processed,
            successCount: result.successCount,
            errorCount: result.errorCount,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk deactivate categories
   * POST /api/categories/bulk-deactivate
   */
  bulkDeactivate = async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { categoryIds } = req.body;

      if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        throw new AppError('Category IDs must be a non-empty array', 400);
      }

      const result = await this.categoryBulkOperationsService.bulkDeactivate(
        tenantId,
        userId,
        categoryIds
      );

      res.json(
        successResponse(result, 'Categories deactivated successfully', 200, {
          bulkOperation: {
            processed: result.processed,
            successCount: result.successCount,
            errorCount: result.errorCount,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk delete categories
   * POST /api/categories/bulk-delete
   */
  bulkDelete = async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { categoryIds } = req.body;

      if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        throw new AppError('Category IDs must be a non-empty array', 400);
      }

      const result = await this.categoryBulkOperationsService.bulkDelete(
        tenantId,
        userId,
        categoryIds
      );

      res.json(
        successResponse(result, 'Categories deleted successfully', 200, {
          bulkOperation: {
            processed: result.processed,
            successCount: result.successCount,
            errorCount: result.errorCount,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk assign parent to categories
   * POST /api/categories/bulk-assign-parent
   */
  bulkAssignParent = async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { categoryIds, parentId } = req.body;

      if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        throw new AppError('Category IDs must be a non-empty array', 400);
      }

      if (!parentId) {
        throw new AppError('Parent ID is required', 400);
      }

      const result = await this.categoryBulkOperationsService.bulkAssignParent(
        tenantId,
        userId,
        categoryIds,
        parentId
      );

      res.json(
        successResponse(result, 'Categories parent assigned successfully', 200, {
          bulkOperation: {
            processed: result.processed,
            successCount: result.successCount,
            errorCount: result.errorCount,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk update sort order
   * POST /api/categories/bulk-update-sort-order
   */
  bulkUpdateSortOrder = async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { updates } = req.body;

      if (!Array.isArray(updates) || updates.length === 0) {
        throw new AppError('Updates must be a non-empty array', 400);
      }

      const result = await this.categoryBulkOperationsService.bulkUpdateSortOrder(
        tenantId,
        userId,
        updates
      );

      res.json(
        successResponse(result, 'Categories sort order updated successfully', 200, {
          bulkOperation: {
            processed: result.processed,
            successCount: result.successCount,
            errorCount: result.errorCount,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk assign color and icon
   * POST /api/categories/bulk-assign-color-icon
   */
  bulkAssignColorAndIcon = async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { categoryIds, color, icon } = req.body;

      if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        throw new AppError('Category IDs must be a non-empty array', 400);
      }

      const result = await this.categoryBulkOperationsService.bulkAssignColorAndIcon(
        tenantId,
        userId,
        categoryIds,
        color,
        icon
      );

      res.json(
        successResponse(result, 'Categories color and icon assigned successfully', 200, {
          bulkOperation: {
            processed: result.processed,
            successCount: result.successCount,
            errorCount: result.errorCount,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk select categories (helper for UI)
   * GET /api/categories/bulk-select
   */
  bulkSelect = async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // This endpoint is mainly for UI purposes to handle bulk selection
      // The actual selection is handled on the frontend
      const { categoryIds, action } = req.query;

      if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        throw new AppError('Category IDs must be a non-empty array', 400);
      }

      // Return a success response indicating the selection was processed
      res.json(
        successResponse(
          { categoryIds, action },
          'Categories selected successfully',
          200
        )
      );
    } catch (error) {
      next(error);
    }
  };
}