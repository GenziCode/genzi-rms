import { Request, Response, NextFunction } from 'express';
import { CategoryAutomationRuleService } from '../services/categoryAutomationRule.service';
import { successResponse } from '../utils/response';
import { AppError } from '../utils/appError';

export class CategoryAutomationRuleController {
  private categoryAutomationRuleService: CategoryAutomationRuleService;

  constructor() {
    this.categoryAutomationRuleService = new CategoryAutomationRuleService();
  }

  /**
   * Create a new automation rule
   * POST /api/category-automation-rules
   */
  createRule = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { name, description, triggerEvent, conditions, actions, priority } = req.body;

      const rule = await this.categoryAutomationRuleService.createRule(tenantId, userId, {
        name,
        description,
        triggerEvent,
        conditions,
        actions,
        priority,
      });

      res.status(201).json(
        successResponse(rule, 'Category automation rule created successfully', 201)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all automation rules
   * GET /api/category-automation-rules
   */
  getRules = async (
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

      const result = await this.categoryAutomationRuleService.getRules(tenantId, {
        includeInactive: includeInactive === 'true',
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json(
        successResponse(result.rules, 'Category automation rules retrieved successfully', 200, {
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
   * Get automation rule by ID
   * GET /api/category-automation-rules/:id
   */
  getRuleById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { id } = req.params;

      const rule = await this.categoryAutomationRuleService.getRuleById(tenantId, id);

      res.json(successResponse(rule, 'Automation rule retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update automation rule
   * PUT /api/category-automation-rules/:id
   */
  updateRule = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { id } = req.params;
      const { name, description, triggerEvent, conditions, actions, isActive, priority } = req.body;

      const rule = await this.categoryAutomationRuleService.updateRule(tenantId, id, userId, {
        name,
        description,
        triggerEvent,
        conditions,
        actions,
        isActive,
        priority,
      });

      res.json(successResponse(rule, 'Category automation rule updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete automation rule
   * DELETE /api/category-automation-rules/:id
   */
  deleteRule = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { id } = req.params;

      await this.categoryAutomationRuleService.deleteRule(tenantId, id, userId);

      res.json(successResponse(null, 'Category automation rule deleted successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Test automation rule conditions
   * POST /api/category-automation-rules/test
   */
  testRule = async (
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
      const result = this.categoryAutomationRuleService.evaluateConditions(conditions, testData);

      res.json(successResponse({ result }, 'Rule conditions tested successfully'));
    } catch (error) {
      next(error);
    }
  };
}