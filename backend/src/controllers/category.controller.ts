import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';
import { successResponse } from '../utils/response';
import { AppError } from '../utils/appError';

export class CategoryController {
  private categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  /**
   * Create a new category
   * POST /api/categories
   */
  createCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { name, description, color, icon, sortOrder } = req.body;

      const category = await this.categoryService.createCategory(
        tenantId,
        userId,
        {
          name,
          description,
          color,
          icon,
          sortOrder,
        }
      );

      res
        .status(201)
        .json(
          successResponse(category, 'Category created successfully', 201)
        );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all categories
   * GET /api/categories
   */
  getCategories = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const {
        includeInactive,
        search,
        sortBy,
        sortOrder,
        page,
        limit,
      } = req.query;

      const result = await this.categoryService.getCategories(tenantId, {
        includeInactive: includeInactive === 'true',
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json(
        successResponse(result, 'Categories retrieved successfully', 200, {
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
   * Get category by ID
   * GET /api/categories/:id
   */
  getCategoryById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { id } = req.params;

      const category = await this.categoryService.getCategoryById(
        tenantId,
        id
      );

      res.json(successResponse(category, 'Category retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update category
   * PUT /api/categories/:id
   */
  updateCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { id } = req.params;
      const { name, description, color, icon, sortOrder, isActive } = req.body;

      const category = await this.categoryService.updateCategory(
        tenantId,
        id,
        userId,
        {
          name,
          description,
          color,
          icon,
          sortOrder,
          isActive,
        }
      );

      res.json(successResponse(category, 'Category updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete category
   * DELETE /api/categories/:id
   */
  deleteCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { id } = req.params;

      await this.categoryService.deleteCategory(tenantId, id, userId);

      res.json(successResponse(null, 'Category deleted successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update category sort order
   * PUT /api/categories/sort-order
   */
  updateSortOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { updates } = req.body;

      if (!Array.isArray(updates)) {
        throw new AppError('Updates must be an array', 400);
      }

      await this.categoryService.updateSortOrder(tenantId, userId, updates);

      res.json(successResponse(null, 'Sort order updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get category statistics
   * GET /api/categories/stats
   */
  getCategoryStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;

      const stats = await this.categoryService.getCategoryStats(tenantId);

      res.json(successResponse(stats, 'Category stats retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };
}

