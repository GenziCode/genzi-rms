import { Request, Response } from 'express';
import { CategoryPermissionService } from '../services/categoryPermission.service';
import { TenantRequest } from '../types';

export class CategoryPermissionController {
  /**
   * Check if a user has specific permissions for a category
   */
  async checkPermission(req: Request, res: Response): Promise<void> {
    try {
      const { userId, categoryId, permission } = req.params;
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;

      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      if (!userId || !categoryId || !permission) {
        res.status(40).json({ success: false, message: 'User ID, Category ID, and Permission are required' });
        return;
      }

      const result = await CategoryPermissionService.checkPermission(userId, categoryId, permission, tenantId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error checking category permission:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking category permissions',
        error: (error as Error).message
      });
    }
  }

  /**
   * Assign permissions to a user for a specific category
   */
  async assignPermission(req: Request, res: Response): Promise<void> {
    try {
      const { userId, categoryId } = req.params;
      const { permissions } = req.body;
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;
      const assignedBy = tenantReq.user?.id;

      if (!tenantId) {
        res.status(40).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      if (!assignedBy) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      if (!userId || !categoryId) {
        res.status(40).json({ success: false, message: 'User ID and Category ID are required' });
        return;
      }

      if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
        res.status(400).json({ success: false, message: 'Permissions array is required and cannot be empty' });
        return;
      }

      const result = await CategoryPermissionService.assignPermission(
        userId,
        categoryId,
        permissions,
        tenantId,
        assignedBy
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Permissions assigned successfully'
      });
    } catch (error) {
      console.error('Error assigning category permission:', error);
      res.status(500).json({
        success: false,
        message: 'Error assigning category permissions',
        error: (error as Error).message
      });
    }
  }

 /**
   * Remove permissions from a user for a specific category
   */
  async removePermission(req: Request, res: Response): Promise<void> {
    try {
      const { userId, categoryId } = req.params;
      const { permissions } = req.body;
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;
      const removedBy = tenantReq.user?.id;

      if (!tenantId) {
        res.status(40).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      if (!removedBy) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      if (!userId || !categoryId) {
        res.status(40).json({ success: false, message: 'User ID and Category ID are required' });
        return;
      }

      if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
        res.status(400).json({ success: false, message: 'Permissions array is required and cannot be empty' });
        return;
      }

      const result = await CategoryPermissionService.removePermission(
        userId,
        categoryId,
        permissions,
        tenantId,
        removedBy
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Permissions removed successfully'
      });
    } catch (error) {
      console.error('Error removing category permission:', error);
      res.status(500).json({
        success: false,
        message: 'Error removing category permissions',
        error: (error as Error).message
      });
    }
  }

 /**
   * Get all permissions for a user in a specific category
   */
  async getUserPermissions(req: Request, res: Response): Promise<void> {
    try {
      const { userId, categoryId } = req.params;
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;

      if (!tenantId) {
        res.status(40).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      if (!userId || !categoryId) {
        res.status(400).json({ success: false, message: 'User ID and Category ID are required' });
        return;
      }

      const permissions = await CategoryPermissionService.getUserPermissions(
        userId,
        categoryId,
        tenantId
      );

      res.status(200).json({
        success: true,
        data: {
          userId,
          categoryId,
          permissions
        }
      });
    } catch (error) {
      console.error('Error getting user permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting user permissions',
        error: (error as Error).message
      });
    }
  }

  /**
   * Get all users with permissions for a specific category
   */
  async getUsersWithPermissions(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId } = req.params;
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;

      if (!tenantId) {
        res.status(40).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      if (!categoryId) {
        res.status(400).json({ success: false, message: 'Category ID is required' });
        return;
      }

      const users = await CategoryPermissionService.getUsersWithPermissions(
        categoryId,
        tenantId
      );

      res.status(200).json({
        success: true,
        data: {
          categoryId,
          users
        }
      });
    } catch (error) {
      console.error('Error getting users with permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting users with permissions',
        error: (error as Error).message
      });
    }
  }

 /**
   * Bulk assign permissions to multiple users for a category
   */
  async bulkAssignPermissions(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId } = req.params;
      const { userIds, permissions } = req.body;
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;
      const assignedBy = tenantReq.user?.id;

      if (!tenantId) {
        res.status(40).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      if (!assignedBy) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      if (!categoryId) {
        res.status(400).json({ success: false, message: 'Category ID is required' });
        return;
      }

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({ success: false, message: 'User IDs array is required and cannot be empty' });
        return;
      }

      if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
        res.status(400).json({ success: false, message: 'Permissions array is required and cannot be empty' });
        return;
      }

      const results = await CategoryPermissionService.bulkAssignPermissions(
        userIds,
        categoryId,
        permissions,
        tenantId,
        assignedBy
      );

      res.status(200).json({
        success: true,
        data: {
          categoryId,
          results
        },
        message: 'Bulk permissions assigned successfully'
      });
    } catch (error) {
      console.error('Error in bulk assign permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Error in bulk assign permissions',
        error: (error as Error).message
      });
    }
  }

  /**
   * Get all categories a user has specific permissions for
   */
  async getUserCategories(req: Request, res: Response): Promise<void> {
    try {
      const { userId, permission } = req.params;
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;

      if (!tenantId) {
        res.status(40).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      if (!userId) {
        res.status(40).json({ success: false, message: 'User ID is required' });
        return;
      }

      if (!permission) {
        res.status(40).json({ success: false, message: 'Permission is required' });
        return;
      }

      const categories = await CategoryPermissionService.getUserCategories(
        userId,
        permission,
        tenantId
      );

      res.status(200).json({
        success: true,
        data: {
          userId,
          permission,
          categories
        }
      });
    } catch (error) {
      console.error('Error getting user categories:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting user categories',
        error: (error as Error).message
      });
    }
  }
}