import { CategoryPermission, ICategoryPermission } from '../models/categoryPermission.model';
import { ICategory } from '../models/category.model';
import { ITenant } from '../models/tenant.model';
import { IUser } from '../models/user.model';
import { getTenantConnection } from '../config/database';
import { UserRole } from '../types';

export interface IPermissionCheck {
  allowed: boolean;
  reason?: string;
}

export class CategoryPermissionService {
  /**
   * Get the Category model for a specific tenant
   */
  private static async getCategoryModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    // Check if the model is already registered, if not register it
    if (!connection.models.Category) {
      const { CategorySchema } = await import('../models/category.model');
      return connection.model<ICategory>('Category', CategorySchema);
    }
    return connection.model<ICategory>('Category');
  }

 /**
   * Get the User model for a specific tenant
   */
  private static async getUserModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    // Check if the model is already registered, if not register it
    if (!connection.models.User) {
      const { UserSchema } = await import('../models/user.model');
      return connection.model<IUser>('User', UserSchema);
    }
    return connection.model<IUser>('User');
  }

 /**
   * Check if a user has specific permissions for a category
   */
  static async checkPermission(
    userId: string,
    categoryId: string,
    permission: string,
    tenantId: string
  ): Promise<IPermissionCheck> {
    try {
      const Category = await this.getCategoryModel(tenantId);
      
      // First, verify that the category belongs to the tenant
      const category = await Category.findOne({ _id: categoryId });
      if (!category) {
        return {
          allowed: false,
          reason: 'Category does not exist or does not belong to this tenant'
        };
      }

      // Check for super admin or admin permissions
      const user = await this.getUserById(userId, tenantId);
      if (user && (user.role === UserRole.OWNER || user.role === UserRole.ADMIN)) {
        return { allowed: true };
      }

      // Check specific permissions
      const permissionDoc = await CategoryPermission.findOne({
        userId,
        categoryId,
        tenantId
      });

      if (!permissionDoc) {
        // User has no explicit permissions, check default permissions
        // For now, default to read-only for all users in the tenant
        return {
          allowed: permission === 'read',
          reason: permission === 'read' ? undefined : 'User has no explicit permissions for this category'
        };
      }

      // Check if the user has the requested permission
      if (permissionDoc.permissions.includes(permission) ||
          permissionDoc.permissions.includes('manage')) {
        return { allowed: true };
      }

      // Check for hierarchical permissions (e.g., if user can manage parent category)
      if (category.parent) {
        const parentPermission = await this.checkPermission(
          userId,
          category.parent.toString(),
          'manage',
          tenantId
        );
        
        if (parentPermission.allowed) {
          return { allowed: true };
        }
      }

      return {
        allowed: false,
        reason: `User does not have '${permission}' permission for this category`
      };
    } catch (error) {
      console.error('Error checking category permission:', error);
      return {
        allowed: false,
        reason: 'Error checking permissions'
      };
    }
  }

  /**
   * Assign permissions to a user for a specific category
   */
  static async assignPermission(
    userId: string,
    categoryId: string,
    permissions: string[],
    tenantId: string,
    assignedBy: string
 ): Promise<ICategoryPermission | null> {
    try {
      const Category = await this.getCategoryModel(tenantId);
      
      // Verify that the category belongs to the tenant
      const category = await Category.findOne({ _id: categoryId });
      if (!category) {
        throw new Error('Category does not exist or does not belong to this tenant');
      }

      // Verify that the assigning user has permission to manage permissions
      const assigningUserPermission = await this.checkPermission(
        assignedBy,
        categoryId,
        'manage',
        tenantId
      );

      if (!assigningUserPermission.allowed) {
        throw new Error('User does not have permission to assign permissions for this category');
      }

      // Validate permissions
      const validPermissions = [
        'read',
        'write',
        'delete',
        'manage',
        'assign',
        'viewHierarchy',
        'createSubcategory'
      ];

      const invalidPermissions = permissions.filter(
        perm => !validPermissions.includes(perm)
      );

      if (invalidPermissions.length > 0) {
        throw new Error(`Invalid permissions: ${invalidPermissions.join(', ')}`);
      }

      // Create or update the permission document
      const permissionDoc = await CategoryPermission.findOne({
        userId,
        categoryId,
        tenantId
      });

      if (permissionDoc) {
        // Update existing permissions
        permissionDoc.permissions = [...new Set([...permissionDoc.permissions, ...permissions])];
        permissionDoc.updatedAt = new Date();
        return await permissionDoc.save();
      } else {
        // Create new permission document
        const newPermission = new CategoryPermission({
          userId,
          categoryId,
          tenantId,
          permissions
        });
        return await newPermission.save();
      }
    } catch (error) {
      console.error('Error assigning category permission:', error);
      throw error;
    }
  }

  /**
   * Remove permissions from a user for a specific category
   */
  static async removePermission(
    userId: string,
    categoryId: string,
    permissions: string[],
    tenantId: string,
    removedBy: string
  ): Promise<boolean> {
    try {
      // Verify that the removing user has permission to manage permissions
      const removingUserPermission = await this.checkPermission(
        removedBy,
        categoryId,
        'manage',
        tenantId
      );

      if (!removingUserPermission.allowed) {
        throw new Error('User does not have permission to remove permissions for this category');
      }

      const permissionDoc = await CategoryPermission.findOne({
        userId,
        categoryId,
        tenantId
      });

      if (!permissionDoc) {
        return true; // No permissions to remove
      }

      // Remove specified permissions
      permissionDoc.permissions = permissionDoc.permissions.filter(
        perm => !permissions.includes(perm)
      );

      if (permissionDoc.permissions.length === 0) {
        // If no permissions left, remove the document entirely
        await CategoryPermission.deleteOne({ _id: permissionDoc._id });
      } else {
        await permissionDoc.save();
      }

      return true;
    } catch (error) {
      console.error('Error removing category permission:', error);
      throw error;
    }
  }

  /**
   * Get all permissions for a user in a specific category
   */
  static async getUserPermissions(
    userId: string,
    categoryId: string,
    tenantId: string
  ): Promise<string[]> {
    try {
      const permissionDoc = await CategoryPermission.findOne({
        userId,
        categoryId,
        tenantId
      });

      if (permissionDoc) {
        return permissionDoc.permissions;
      }

      // Check if user has permissions on parent category
      const Category = await this.getCategoryModel(tenantId);
      const category = await Category.findOne({ _id: categoryId });
      if (category && category.parent) {
        const parentPermissions = await this.getUserPermissions(
          userId,
          category.parent.toString(),
          tenantId
        );
        
        // If user has 'manage' permission on parent, they get read permission on child
        if (parentPermissions.includes('manage')) {
          return ['read'];
        }
      }

      // Default to read permission if user is in the tenant
      const user = await this.getUserById(userId, tenantId);
      if (user) {
        return ['read'];
      }

      return [];
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

 /**
   * Get all users with permissions for a specific category
   */
  static async getUsersWithPermissions(
    categoryId: string,
    tenantId: string
  ): Promise<{ userId: string; permissions: string[] }[]> {
    try {
      const permissions = await CategoryPermission.find({
        categoryId,
        tenantId
      });

      return permissions.map(perm => ({
        userId: perm.userId,
        permissions: perm.permissions
      }));
    } catch (error) {
      console.error('Error getting users with permissions:', error);
      return [];
    }
  }

  /**
   * Bulk assign permissions to multiple users for a category
   */
  static async bulkAssignPermissions(
    userIds: string[],
    categoryId: string,
    permissions: string[],
    tenantId: string,
    assignedBy: string
 ): Promise<{ success: boolean; userId: string; error?: string }[]> {
    try {
      const results: { success: boolean; userId: string; error?: string }[] = [];

      for (const userId of userIds) {
        try {
          await this.assignPermission(userId, categoryId, permissions, tenantId, assignedBy);
          results.push({ success: true, userId });
        } catch (error) {
          results.push({
            success: false,
            userId,
            error: (error as Error).message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error in bulk assign permissions:', error);
      throw error;
    }
  }

  /**
   * Get all categories a user has specific permissions for
   */
  static async getUserCategories(
    userId: string,
    permission: string,
    tenantId: string
  ): Promise<string[]> {
    try {
      const permissionDocs = await CategoryPermission.find({
        userId,
        tenantId,
        permissions: { $in: [permission, 'manage'] }
      });

      return permissionDocs.map(doc => doc.categoryId);
    } catch (error) {
      console.error('Error getting user categories:', error);
      return [];
    }
  }

 /**
   * Helper method to get user by ID
   * In a real implementation, this would likely use a user service
   */
  private static async getUserById(userId: string, tenantId: string): Promise<IUser | null> {
    try {
      const User = await this.getUserModel(tenantId);
      const user = await User.findById(userId);
      return user;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }
}
