import { Request, Response } from 'express';
import { CategoryValidationRuleService } from '../services/categoryValidationRule.service';
import { TenantRequest } from '../types';

export class CategoryValidationRuleController {
  private categoryValidationRuleService = new CategoryValidationRuleService();

  /**
   * Create a new category validation rule
   */
  async createValidationRule(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;

      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      const rule = await this.categoryValidationRuleService.createValidationRule(
        tenantId,
        req.body
      );

      res.status(201).json({
        success: true,
        data: rule,
        message: 'Validation rule created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating validation rule',
        error: (error as Error).message
      });
    }
  }

  /**
   * Get validation rules with pagination and filtering
   */
  async getValidationRules(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;

      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        field,
        validationType,
        isActive
      } = req.query;

      const rules = await this.categoryValidationRuleService.getValidationRules(
        tenantId,
        {
          page: Number(page),
          limit: Number(limit),
          sortBy: String(sortBy),
          sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
          field: field ? String(field) : undefined,
          validationType: validationType ? String(validationType) : undefined,
          isActive: isActive !== undefined ? isActive === 'true' : true
        }
      );

      res.status(200).json({
        success: true,
        data: rules
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting validation rules',
        error: (error as Error).message
      });
    }
  }

  /**
   * Get a specific validation rule by ID
   */
  async getValidationRuleById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;

      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      const rule = await this.categoryValidationRuleService.getValidationRuleById(
        tenantId,
        id
      );

      if (!rule) {
        res.status(404).json({
          success: false,
          message: 'Validation rule not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: rule
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting validation rule',
        error: (error as Error).message
      });
    }
  }

  /**
   * Update a validation rule
   */
  async updateValidationRule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;

      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      const rule = await this.categoryValidationRuleService.updateValidationRule(
        tenantId,
        id,
        req.body
      );

      res.status(200).json({
        success: true,
        data: rule,
        message: 'Validation rule updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating validation rule',
        error: (error as Error).message
      });
    }
  }

  /**
   * Delete a validation rule
   */
  async deleteValidationRule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;

      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      await this.categoryValidationRuleService.deleteValidationRule(
        tenantId,
        id
      );

      res.status(200).json({
        success: true,
        message: 'Validation rule deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting validation rule',
        error: (error as Error).message
      });
    }
  }

  /**
   * Validate a category against active validation rules
   */
  async validateCategory(req: Request, res: Response): Promise<void> {
    try {
      const { category, categoryId } = req.body;
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;

      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      const result = await this.categoryValidationRuleService.validateCategory(
        tenantId,
        category,
        categoryId
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error validating category',
        error: (error as Error).message
      });
    }
  }

  /**
   * Get validation rules for a specific field
   */
  async getValidationRulesByField(req: Request, res: Response): Promise<void> {
    try {
      const { field } = req.params;
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;

      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      const rules = await this.categoryValidationRuleService.getValidationRulesByField(
        tenantId,
        field
      );

      res.status(200).json({
        success: true,
        data: rules
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting validation rules for field',
        error: (error as Error).message
      });
    }
  }
}