import { Request, Response, NextFunction } from 'express';
import { CategoryTemplateService } from '../services/categoryTemplate.service';
import { successResponse } from '../utils/response';

export class CategoryTemplateController {
  private categoryTemplateService: CategoryTemplateService;

  constructor() {
    this.categoryTemplateService = new CategoryTemplateService();
  }

  /**
   * Create a new category template
   * POST /api/categories/templates
   */
  createTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { name, description, categoryStructure, isPublic, tags } = req.body;

      const template = await this.categoryTemplateService.createTemplate(
        tenantId,
        userId,
        {
          name,
          description,
          categoryStructure,
          isPublic,
          tags,
        }
      );

      res.status(201).json(
        successResponse(template, 'Category template created successfully', 201)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all category templates
   * GET /api/categories/templates
   */
  getTemplates = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { search, tags, includePublic } = req.query;

      const templates = await this.categoryTemplateService.getTemplates(
        tenantId,
        {
          search: search as string,
          tags: tags ? (tags as string).split(',') : [],
          includePublic: includePublic !== 'false', // Default to true
        }
      );

      res.json(
        successResponse(templates, 'Category templates retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get category template by ID
   * GET /api/categories/templates/:id
   */
  getTemplateById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { id } = req.params;

      const template = await this.categoryTemplateService.getTemplateById(
        tenantId,
        id
      );

      res.json(
        successResponse(template, 'Category template retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update category template
   * PUT /api/categories/templates/:id
   */
  updateTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { id } = req.params;
      const { name, description, categoryStructure, isPublic, tags } = req.body;

      const template = await this.categoryTemplateService.updateTemplate(
        tenantId,
        id,
        userId,
        {
          name,
          description,
          categoryStructure,
          isPublic,
          tags,
        }
      );

      res.json(
        successResponse(template, 'Category template updated successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete category template
   * DELETE /api/categories/templates/:id
   */
  deleteTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { id } = req.params;

      await this.categoryTemplateService.deleteTemplate(tenantId, id, userId);

      res.json(
        successResponse(null, 'Category template deleted successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Apply template to create categories
   * POST /api/categories/templates/:id/apply
   */
  applyTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { id } = req.params;
      const { prefix, parentCategoryId } = req.body;

      const categories = await this.categoryTemplateService.applyTemplate(
        tenantId,
        id,
        userId,
        {
          prefix,
          parentCategoryId,
        }
      );

      res.status(201).json(
        successResponse(
          categories,
          `Template applied successfully. ${categories.length} categories created.`
        )
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Save existing category as template
   * POST /api/categories/:id/save-template
   */
  saveCategoryAsTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { id } = req.params; // Category ID
      const { templateName, description, tags } = req.body;

      const template = await this.categoryTemplateService.saveCategoryAsTemplate(
        tenantId,
        userId,
        id,
        templateName,
        description,
        tags
      );

      res.status(201).json(
        successResponse(template, 'Category saved as template successfully', 201)
      );
    } catch (error) {
      next(error);
    }
  };
}