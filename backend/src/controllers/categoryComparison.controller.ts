import { Request, Response, NextFunction } from 'express';
import { CategoryComparisonService } from '../services/categoryComparison.service';
import { AppError } from '../utils/appError';

export class CategoryComparisonController {
  private comparisonService: CategoryComparisonService;

  constructor() {
    this.comparisonService = new CategoryComparisonService();
  }

  compareCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        throw new AppError('Tenant ID not found', 400);
      }
      const { categoryIds } = req.body;
      if (!categoryIds || !Array.isArray(categoryIds)) {
        throw new AppError('categoryIds must be an array of category IDs.', 400);
      }

      const comparison = await this.comparisonService.compareCategories(tenantId, categoryIds);
      res.status(200).json({ success: true, data: comparison });
    } catch (error) {
      next(error);
    }
  };

  findSimilarCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        throw new AppError('Tenant ID not found', 400);
      }
      const { categoryId } = req.params;
      const similarCategories = await this.comparisonService.findSimilarCategories(tenantId, categoryId);
      res.status(200).json({ success: true, data: similarCategories });
    } catch (error) {
      next(error);
    }
  };
}