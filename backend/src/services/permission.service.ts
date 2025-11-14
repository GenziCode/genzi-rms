import mongoose from 'mongoose';
import { getMasterConnection } from '../config/database';
import { PermissionSchema, IPermission } from '../models/permission.model';
import { NotFoundError } from '../utils/appError';
import { logger } from '../utils/logger';

/**
 * Permission Service
 * Manages permissions and permission checks
 */
export class PermissionService {
  private permissionCache: Map<string, IPermission[]> | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get Permission model
   */
  private async getPermissionModel() {
    const masterConn = await getMasterConnection();
    return (
      masterConn.models.Permission ||
      masterConn.model<IPermission>('Permission', PermissionSchema)
    );
  }

  /**
   * Clear permission cache
   */
  clearCache(): void {
    this.permissionCache = null;
    this.cacheExpiry = 0;
    logger.debug('Permission cache cleared');
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    return (
      this.permissionCache !== null &&
      Date.now() < this.cacheExpiry
    );
  }

  /**
   * Get all permissions
   * @param useCache - Whether to use cache (default: true)
   */
  async getAllPermissions(useCache: boolean = true): Promise<IPermission[]> {
    if (useCache && this.isCacheValid() && this.permissionCache) {
      logger.debug('Returning permissions from cache');
      return Array.from(this.permissionCache.values()).flat();
    }

    const Permission = await this.getPermissionModel();
    const permissions = await Permission.find({ isSystem: true }).sort({ module: 1, action: 1 });

    // Update cache
    if (useCache) {
      this.permissionCache = new Map();
      permissions.forEach(perm => {
        const key = perm.module;
        if (!this.permissionCache!.has(key)) {
          this.permissionCache!.set(key, []);
        }
        this.permissionCache!.get(key)!.push(perm);
      });
      this.cacheExpiry = Date.now() + this.CACHE_TTL;
      logger.debug(`Cached ${permissions.length} permissions`);
    }

    return permissions;
  }

  /**
   * Get permissions by module
   * @param module - Module name (e.g., 'product', 'customer')
   */
  async getPermissionsByModule(module: string): Promise<IPermission[]> {
    const Permission = await this.getPermissionModel();
    return Permission.find({
      module: module.toLowerCase(),
      isSystem: true,
    }).sort({ action: 1 });
  }

  /**
   * Get permission by code
   * @param code - Permission code (e.g., 'product:create')
   */
  async getPermissionByCode(code: string): Promise<IPermission | null> {
    const Permission = await this.getPermissionModel();
    return Permission.findOne({
      code: code.toLowerCase(),
      isSystem: true,
    });
  }

  /**
   * Check if permission exists
   * @param code - Permission code
   */
  async permissionExists(code: string): Promise<boolean> {
    const permission = await this.getPermissionByCode(code);
    return permission !== null;
  }

  /**
   * Check if user has permission
   * Supports wildcard permissions (*) and module wildcards (module:*)
   * @param userPermissions - Array of permission codes the user has
   * @param requiredPermission - Required permission code (e.g., 'product:create')
   */
  hasPermission(
    userPermissions: string[],
    requiredPermission: string
  ): boolean {
    // Check for wildcard permission (all permissions)
    if (userPermissions.includes('*')) {
      return true;
    }

    // Exact match
    if (userPermissions.includes(requiredPermission.toLowerCase())) {
      return true;
    }

    // Check for module wildcard (e.g., 'product:*' grants 'product:create')
    const [module, action] = requiredPermission.toLowerCase().split(':');
    const moduleWildcard = `${module}:*`;
    if (userPermissions.includes(moduleWildcard)) {
      return true;
    }

    return false;
  }

  /**
   * Check if user has any of the required permissions
   * @param userPermissions - Array of permission codes the user has
   * @param requiredPermissions - Array of required permission codes
   */
  hasAnyPermission(
    userPermissions: string[],
    requiredPermissions: string[]
  ): boolean {
    return requiredPermissions.some(perm =>
      this.hasPermission(userPermissions, perm)
    );
  }

  /**
   * Check if user has all required permissions
   * @param userPermissions - Array of permission codes the user has
   * @param requiredPermissions - Array of required permission codes
   */
  hasAllPermissions(
    userPermissions: string[],
    requiredPermissions: string[]
  ): boolean {
    return requiredPermissions.every(perm =>
      this.hasPermission(userPermissions, perm)
    );
  }

  /**
   * Get permissions grouped by module
   */
  async getPermissionsGroupedByModule(): Promise<
    Record<string, IPermission[]>
  > {
    const permissions = await this.getAllPermissions();
    const grouped: Record<string, IPermission[]> = {};

    permissions.forEach(perm => {
      if (!grouped[perm.module]) {
        grouped[perm.module] = [];
      }
      grouped[perm.module].push(perm);
    });

    return grouped;
  }

  /**
   * Get permissions by category
   * @param category - Permission category ('crud', 'action', 'report', 'admin')
   */
  async getPermissionsByCategory(
    category: 'crud' | 'action' | 'report' | 'admin'
  ): Promise<IPermission[]> {
    const Permission = await this.getPermissionModel();
    return Permission.find({
      category,
      isSystem: true,
    }).sort({ module: 1, action: 1 });
  }

  /**
   * Create a new permission (admin only)
   * @param data - Permission data
   */
  async createPermission(data: {
    code: string;
    name: string;
    module: string;
    action: string;
    description?: string;
    category?: 'crud' | 'action' | 'report' | 'admin';
  }): Promise<IPermission> {
    const Permission = await this.getPermissionModel();

    // Check if permission already exists
    const existing = await Permission.findOne({ code: data.code.toLowerCase() });
    if (existing) {
      throw new NotFoundError(`Permission with code '${data.code}' already exists`);
    }

    const permission = await Permission.create({
      code: data.code.toLowerCase(),
      name: data.name,
      module: data.module.toLowerCase(),
      action: data.action.toLowerCase(),
      description: data.description,
      category: data.category || 'crud',
      isSystem: false, // Custom permissions are not system permissions
    });

    // Clear cache
    this.clearCache();

    logger.info(`Created permission: ${permission.code}`);
    return permission;
  }

  /**
   * Get all modules that have permissions
   */
  async getModules(): Promise<string[]> {
    const Permission = await this.getPermissionModel();
    const modules = await Permission.distinct('module', { isSystem: true });
    return modules.sort();
  }

  /**
   * Get permission statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byModule: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    const Permission = await this.getPermissionModel();
    const permissions = await Permission.find({ isSystem: true });

    const byModule: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    permissions.forEach(perm => {
      // Count by module
      byModule[perm.module] = (byModule[perm.module] || 0) + 1;

      // Count by category
      byCategory[perm.category] = (byCategory[perm.category] || 0) + 1;
    });

    return {
      total: permissions.length,
      byModule,
      byCategory,
    };
  }
}

// Export singleton instance
export const permissionService = new PermissionService();

