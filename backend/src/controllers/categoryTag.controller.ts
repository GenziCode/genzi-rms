import { Request, Response, NextFunction } from 'express';
import { CategoryTagService } from '../services/categoryTag.service';
import { successResponse } from '../utils/response';
import { AppError } from '../utils/appError';

export class CategoryTagController {
  private categoryTagService: CategoryTagService;

  constructor() {
    this.categoryTagService = new CategoryTagService();
  }

  /**
   * Create a new category tag
   * POST /api/category-tags
   */
  createTag = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { name, description, color, icon } = req.body;

      const tag = await this.categoryTagService.createTag(tenantId, userId, {
        name,
        description,
        color,
        icon,
      });

      res.status(201).json(
        successResponse(tag, 'Category tag created successfully', 201)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all category tags
   * GET /api/category-tags
   */
  getTags = async (
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

      const result = await this.categoryTagService.getTags(tenantId, {
        includeInactive: includeInactive === 'true',
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json(
        successResponse(result.tags, 'Category tags retrieved successfully', 200, {
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
   * Get category tag by ID
   * GET /api/category-tags/:id
   */
  getTagById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { id } = req.params;

      const tag = await this.categoryTagService.getTagById(tenantId, id);

      res.json(successResponse(tag, 'Tag retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update category tag
   * PUT /api/category-tags/:id
   */
  updateTag = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { id } = req.params;
      const { name, description, color, icon, isActive } = req.body;

      const tag = await this.categoryTagService.updateTag(tenantId, id, userId, {
        name,
        description,
        color,
        icon,
        isActive,
      });

      res.json(successResponse(tag, 'Category tag updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete category tag
   * DELETE /api/category-tags/:id
   */
  deleteTag = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { id } = req.params;

      await this.categoryTagService.deleteTag(tenantId, id, userId);

      res.json(successResponse(null, 'Category tag deleted successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Assign tags to a category
   * POST /api/categories/:categoryId/tags
   */
  assignTagsToCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { categoryId } = req.params;
      const { tagIds } = req.body;

      if (!Array.isArray(tagIds)) {
        throw new AppError('tagIds must be an array', 400);
      }

      await this.categoryTagService.assignTagsToCategory(tenantId, categoryId, userId, tagIds);

      res.json(successResponse(null, 'Tags assigned to category successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remove tags from a category
   * DELETE /api/categories/:categoryId/tags
   */
  removeTagsFromCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { categoryId } = req.params;
      const { tagIds } = req.body;

      if (!Array.isArray(tagIds)) {
        throw new AppError('tagIds must be an array', 400);
      }

      await this.categoryTagService.removeTagsFromCategory(tenantId, categoryId, userId, tagIds);

      res.json(successResponse(null, 'Tags removed from category successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get tags for a specific category
   * GET /api/categories/:categoryId/tags
   */
  getCategoryTags = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { categoryId } = req.params;

      const tags = await this.categoryTagService.getCategoryTags(tenantId, categoryId);

      res.json(successResponse(tags, 'Category tags retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };
}