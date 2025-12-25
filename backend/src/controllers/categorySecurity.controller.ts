import { Request, Response } from 'express';
import { CategorySecurityService } from '../services/categorySecurity.service';
import { TenantRequest } from '../types';

export class CategorySecurityController {
  private categorySecurityService = new CategorySecurityService();

  /**
   * Create or update security settings for a category
   */
  async setCategorySecurity(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;
      const userId = tenantReq.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({ success: false, message: 'Tenant ID and user ID are required' });
        return;
      }

      const { categoryId } = req.params;
      const { securitySettings } = req.body;

      if (!categoryId) {
        res.status(400).json({ success: false, message: 'Category ID is required' });
        return;
      }

      const security = await this.categorySecurityService.setCategorySecurity(
        tenantId,
        categoryId,
        userId,
        securitySettings
      );

      res.status(200).json({
        success: true,
        data: security,
        message: 'Category security settings updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error setting category security settings',
        error: (error as Error).message
      });
    }
  }

  /**
   * Get security settings for a category
   */
  async getCategorySecurity(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;

      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      const { categoryId } = req.params;

      if (!categoryId) {
        res.status(400).json({ success: false, message: 'Category ID is required' });
        return;
      }

      const security = await this.categorySecurityService.getCategorySecurity(
        tenantId,
        categoryId
      );

      if (!security) {
        res.status(404).json({ success: false, message: 'Category security settings not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: security
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting category security settings',
        error: (error as Error).message
      });
    }
  }

  /**
   * Remove security settings for a category
   */
  async removeCategorySecurity(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;

      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      const { categoryId } = req.params;

      if (!categoryId) {
        res.status(400).json({ success: false, message: 'Category ID is required' });
        return;
      }

      await this.categorySecurityService.removeCategorySecurity(
        tenantId,
        categoryId
      );

      res.status(200).json({
        success: true,
        message: 'Category security settings removed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error removing category security settings',
        error: (error as Error).message
      });
    }
  }

  /**
   * Get categories accessible by a user based on security settings
   */
  async getUserAccessibleCategories(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;
      const userId = tenantReq.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({ success: false, message: 'Tenant ID and user ID are required' });
        return;
      }

      const { page, limit, sortBy, sortOrder } = req.query;

      const result = await this.categorySecurityService.getUserAccessibleCategories(
        tenantId,
        userId,
        {
          page: page ? parseInt(page as string, 10) : undefined,
          limit: limit ? parseInt(limit as string, 10) : undefined,
          sortBy: sortBy as string,
          sortOrder: sortOrder === 'asc' ? 'asc' : 'desc'
        }
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting user accessible categories',
        error: (error as Error).message
      });
    }
  }

  /**
   * Check if a user has access to a category based on security settings
   */
  async checkCategoryAccess(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;
      const userId = tenantReq.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({ success: false, message: 'Tenant ID and user ID are required' });
        return;
      }

      const { categoryId } = req.params;

      if (!categoryId) {
        res.status(400).json({ success: false, message: 'Category ID is required' });
        return;
      }

      const accessResult = await this.categorySecurityService.checkCategoryAccess(
        tenantId,
        categoryId,
        userId
      );

      res.status(200).json({
        success: true,
        data: accessResult
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error checking category access',
        error: (error as Error).message
      });
    }
  }

  /**
   * Enable threat detection for a category
   */
  async enableThreatDetection(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;
      const userId = tenantReq.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({ success: false, message: 'Tenant ID and user ID are required' });
        return;
      }

      const { categoryId } = req.params;

      if (!categoryId) {
        res.status(400).json({ success: false, message: 'Category ID is required' });
        return;
      }

      const security = await this.categorySecurityService.enableThreatDetection(
        tenantId,
        categoryId,
        userId
      );

      res.status(200).json({
        success: true,
        data: security,
        message: 'Threat detection enabled successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error enabling threat detection',
        error: (error as Error).message
      });
    }
  }

  /**
   * Apply a security policy to a category
   */
  async applySecurityPolicy(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;
      const userId = tenantReq.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({ success: false, message: 'Tenant ID and user ID are required' });
        return;
      }

      const { categoryId } = req.params;
      const { policyName, policySettings } = req.body;

      if (!categoryId || !policyName) {
        res.status(400).json({ success: false, message: 'Category ID and policy name are required' });
        return;
      }

      const result = await this.categorySecurityService.applySecurityPolicy(
        tenantId,
        categoryId,
        userId,
        policyName,
        policySettings
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Security policy applied successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error applying security policy',
        error: (error as Error).message
      });
    }
  }

  /**
   * Check if a user has admin access for security management
   */
  async checkAdminAccess(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;
      const userId = tenantReq.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({ success: false, message: 'Tenant ID and user ID are required' });
        return;
      }

      const hasAdminAccess = await this.categorySecurityService.checkAdminAccess(
        tenantId,
        userId
      );

      res.status(200).json({
        success: true,
        data: { hasAdminAccess }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error checking admin access',
        error: (error as Error).message
      });
    }
  }

  /**
   * Get user security permissions
   */
  async getUserSecurityPermissions(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;
      const userId = tenantReq.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({ success: false, message: 'Tenant ID and user ID are required' });
        return;
      }

      const permissions = await this.categorySecurityService.getUserSecurityPermissions(
        tenantId,
        userId
      );

      res.status(200).json({
        success: true,
        data: permissions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting user security permissions',
        error: (error as Error).message
      });
    }
  }
}