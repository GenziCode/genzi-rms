import { Request, Response, NextFunction } from 'express';
import { CategoryWorkflowService } from '../services/categoryWorkflow.service';
import { successResponse } from '../utils/response';
import { AppError } from '../utils/appError';

export class CategoryWorkflowController {
  private categoryWorkflowService: CategoryWorkflowService;

  constructor() {
    this.categoryWorkflowService = new CategoryWorkflowService();
  }

  /**
   * Create a new category workflow
   * POST /api/category-workflows
   */
  createWorkflow = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { name, description, triggerEvents, conditions, actions } = req.body;

      const workflow = await this.categoryWorkflowService.createWorkflow(tenantId, userId, {
        name,
        description,
        triggerEvents,
        conditions,
        actions,
      });

      res.status(201).json(
        successResponse(workflow, 'Category workflow created successfully', 201)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all category workflows
   * GET /api/category-workflows
   */
  getWorkflows = async (
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

      const result = await this.categoryWorkflowService.getWorkflows(tenantId, {
        includeInactive: includeInactive === 'true',
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json(
        successResponse(result.workflows, 'Category workflows retrieved successfully', 200, {
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
   * Get category workflow by ID
   * GET /api/category-workflows/:id
   */
  getWorkflowById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { id } = req.params;

      const workflow = await this.categoryWorkflowService.getWorkflowById(tenantId, id);

      res.json(successResponse(workflow, 'Workflow retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update category workflow
   * PUT /api/category-workflows/:id
   */
  updateWorkflow = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { id } = req.params;
      const { name, description, triggerEvents, conditions, actions, isActive } = req.body;

      const workflow = await this.categoryWorkflowService.updateWorkflow(tenantId, id, userId, {
        name,
        description,
        triggerEvents,
        conditions,
        actions,
        isActive,
      });

      res.json(successResponse(workflow, 'Category workflow updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete category workflow
   * DELETE /api/category-workflows/:id
   */
  deleteWorkflow = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { id } = req.params;

      await this.categoryWorkflowService.deleteWorkflow(tenantId, id, userId);

      res.json(successResponse(null, 'Category workflow deleted successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Test workflow conditions
   * POST /api/category-workflows/test
   */
  testWorkflow = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { conditions, testData } = req.body;

      if (!conditions || !testData) {
        throw new AppError('Conditions and test data are required', 400);
      }

      // Test the conditions without persisting anything
      const result = this.categoryWorkflowService.evaluateConditions(conditions, testData);

      res.json(successResponse({ result }, 'Workflow tested successfully'));
    } catch (error) {
      next(error);
    }
  };
}