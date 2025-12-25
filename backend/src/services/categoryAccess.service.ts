import { getTenantConnection } from '../config/database';
import { CategorySchema, ICategory } from '../models/category.model';
import { UserRole } from '../types';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export class CategoryAccessService {
  private async getCategoryModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<ICategory>('Category', CategorySchema);
  }

  async setRolePermissions(tenantId: string, categoryId: string, role: UserRole, permissions: string[]): Promise<ICategory> {
    const Category = await this.getCategoryModel(tenantId);
    const category = await Category.findById(categoryId);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const rolePermissions = category.accessControl.roles.find(r => r.role === role);
    if (rolePermissions) {
      rolePermissions.permissions = permissions;
    } else {
      category.accessControl.roles.push({ role, permissions });
    }

    await category.save();
    logger.info(`Permissions for role ${role} set on category ${categoryId}`);
    return category;
  }

  async setUserPermissions(tenantId: string, categoryId: string, userId: string, permissions: string[]): Promise<ICategory> {
    const Category = await this.getCategoryModel(tenantId);
    const category = await Category.findById(categoryId);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const userPermissions = category.accessControl.users.find(u => u.userId.toString() === userId);
    if (userPermissions) {
      userPermissions.permissions = permissions;
    } else {
      category.accessControl.users.push({ userId: userId as any, permissions });
    }

    await category.save();
    logger.info(`Permissions for user ${userId} set on category ${categoryId}`);
    return category;
  }

  async checkPermission(tenantId: string, userId: string, userRole: UserRole, categoryId: string, permission: string): Promise<boolean> {
    const Category = await this.getCategoryModel(tenantId);
    let category: ICategory | null = await Category.findById(categoryId);
  
    if (!category) {
      throw new AppError('Category not found', 404);
    }
  
    // Check for user-specific permissions first
    const userPermission = category.accessControl.users.find(u => u.userId.toString() === userId);
    if (userPermission && userPermission.permissions.includes(permission)) {
      return true;
    }
  
    // Check for role-based permissions
    const rolePermission = category.accessControl.roles.find(r => r.role === userRole);
    if (rolePermission && rolePermission.permissions.includes(permission)) {
      return true;
    }
  
    // Check for inherited permissions from parent categories
    while (category?.parent) {
      category = await Category.findById(category.parent);
      if (category) {
        const parentUserPermission = category.accessControl.users.find(u => u.userId.toString() === userId);
        if (parentUserPermission && parentUserPermission.permissions.includes(permission)) {
          return true;
        }
        const parentRolePermission = category.accessControl.roles.find(r => r.role === userRole);
        if (parentRolePermission && parentRolePermission.permissions.includes(permission)) {
          return true;
        }
      }
    }
  
    return false;
  }
}