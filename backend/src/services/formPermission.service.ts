import mongoose from 'mongoose';
import { getMasterConnection } from '../config/database';
import { FormPermissionSchema, IFormPermission } from '../models/formPermission.model';
import { NotFoundError } from '../utils/appError';
import { logger } from '../utils/logger';
import { roleService } from './role.service';
import { permissionService } from './permission.service';

/**
 * Form Permission Service
 * Manages form-level permissions and access control
 */
export class FormPermissionService {
  private formCache: Map<string, IFormPermission[]> | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get FormPermission model
   */
  private async getFormPermissionModel() {
    const masterConn = await getMasterConnection();
    return (
      masterConn.models.FormPermission ||
      masterConn.model<IFormPermission>('FormPermission', FormPermissionSchema)
    );
  }

  /**
   * Clear form cache
   */
  clearCache(): void {
    this.formCache = null;
    this.cacheExpiry = 0;
    logger.debug('Form permission cache cleared');
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    return (
      this.formCache !== null &&
      Date.now() < this.cacheExpiry
    );
  }

  /**
   * Get all forms for a tenant
   * @param tenantId - Tenant ID
   * @param useCache - Whether to use cache (default: true)
   */
  async getForms(
    tenantId: string,
    useCache: boolean = true
  ): Promise<IFormPermission[]> {
    const cacheKey = `${tenantId}`;

    if (useCache && this.isCacheValid() && this.formCache?.has(cacheKey)) {
      logger.debug(`Returning forms from cache for tenant: ${tenantId}`);
      return this.formCache.get(cacheKey)!;
    }

    const FormPermission = await this.getFormPermissionModel();
    const forms = await FormPermission.find({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      isActive: true,
    }).sort({ formCategory: 1, formCaption: 1 });

    // Update cache
    if (useCache) {
      if (!this.formCache) {
        this.formCache = new Map();
      }
      this.formCache.set(cacheKey, forms);
      this.cacheExpiry = Date.now() + this.CACHE_TTL;
      logger.debug(`Cached ${forms.length} forms for tenant: ${tenantId}`);
    }

    return forms;
  }

  /**
   * Get form by name
   * @param tenantId - Tenant ID
   * @param formName - Form name (e.g., 'frmProductFields')
   */
  async getFormByName(
    tenantId: string,
    formName: string
  ): Promise<IFormPermission | null> {
    const FormPermission = await this.getFormPermissionModel();
    return FormPermission.findOne({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      formName: formName,
      isActive: true,
    });
  }

  /**
   * Get forms by category
   * @param tenantId - Tenant ID
   * @param category - Form category
   */
  async getFormsByCategory(
    tenantId: string,
    category: string
  ): Promise<IFormPermission[]> {
    const FormPermission = await this.getFormPermissionModel();
    return FormPermission.find({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      formCategory: category,
      isActive: true,
    }).sort({ formCaption: 1 });
  }

  /**
   * Get forms by module
   * @param tenantId - Tenant ID
   * @param module - Module name
   */
  async getFormsByModule(
    tenantId: string,
    module: string
  ): Promise<IFormPermission[]> {
    const FormPermission = await this.getFormPermissionModel();
    return FormPermission.find({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      module: module.toLowerCase(),
      isActive: true,
    }).sort({ formCaption: 1 });
  }

  /**
   * Check if user has access to a form
   * @param tenantId - Tenant ID
   * @param userId - User ID
   * @param formName - Form name
   */
  async hasFormAccess(
    tenantId: string,
    userId: string,
    formName: string
  ): Promise<boolean> {
    // Get user's permissions
    const userPermissions = await roleService.getUserPermissions(tenantId, userId);

    // Check for wildcard permission
    if (permissionService.hasPermission(userPermissions, '*')) {
      return true;
    }

    // Get form
    const form = await this.getFormByName(tenantId, formName);
    if (!form) {
      // Form doesn't exist in DB yet - allow access for backward compatibility
      // This handles cases where form permissions haven't been synced yet
      logger.debug(`Form ${formName} not found in DB for tenant ${tenantId}, allowing access (backward compatibility)`);
      return true;
    }

    // If form has associated module, check module permission
    if (form.module) {
      const modulePermission = `${form.module}:read`;
      if (permissionService.hasPermission(userPermissions, modulePermission)) {
        return true;
      }

      // Check module wildcard
      const moduleWildcard = `${form.module}:*`;
      if (permissionService.hasPermission(userPermissions, moduleWildcard)) {
        return true;
      }
    }

    // Check form-specific permission (e.g., 'form:frmProductFields')
    const formPermission = `form:${formName}`;
    if (permissionService.hasPermission(userPermissions, formPermission)) {
      return true;
    }

    return false;
  }

  /**
   * Check if user has access to a route
   * Maps routes to forms and checks permissions
   * @param tenantId - Tenant ID
   * @param userId - User ID
   * @param route - Route path (e.g., '/api/products')
   * @param method - HTTP method (e.g., 'GET', 'POST')
   */
  async hasRouteAccess(
    tenantId: string,
    userId: string,
    route: string,
    method: string
  ): Promise<boolean> {
    // Get user's permissions
    const userPermissions = await roleService.getUserPermissions(tenantId, userId);

    // Check for wildcard permission
    if (permissionService.hasPermission(userPermissions, '*')) {
      return true;
    }

    // Find form by route
    const FormPermission = await this.getFormPermissionModel();
    const form = await FormPermission.findOne({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      route: route,
      httpMethods: method,
      isActive: true,
    });

    if (!form) {
      // No form mapping found - allow access (backward compatibility)
      // In production, you might want to deny by default
      return true;
    }

    // Check form access
    return this.hasFormAccess(tenantId, userId, form.formName);
  }

  /**
   * Create or update form permission
   * @param tenantId - Tenant ID
   * @param data - Form data
   */
  async upsertForm(
    tenantId: string,
    data: {
      formName: string;
      formCaption: string;
      formCategory: string;
      module?: string;
      route?: string;
      httpMethods?: string[];
    }
  ): Promise<IFormPermission> {
    const FormPermission = await this.getFormPermissionModel();

    const form = await FormPermission.findOneAndUpdate(
      {
        tenantId: new mongoose.Types.ObjectId(tenantId),
        formName: data.formName,
      },
      {
        ...data,
        tenantId: new mongoose.Types.ObjectId(tenantId),
        isActive: true,
      },
      {
        upsert: true,
        new: true,
      }
    );

    // Clear cache
    this.clearCache();

    logger.info(`Upserted form: ${form.formName} for tenant: ${tenantId}`);
    return form;
  }

  /**
   * Bulk create/update forms
   * @param tenantId - Tenant ID
   * @param forms - Array of form data
   */
  async bulkUpsertForms(
    tenantId: string,
    forms: Array<{
      formName: string;
      formCaption: string;
      formCategory: string;
      module?: string;
      route?: string;
      httpMethods?: string[];
    }>
  ): Promise<number> {
    const FormPermission = await this.getFormPermissionModel();
    let count = 0;

    for (const formData of forms) {
      await this.upsertForm(tenantId, formData);
      count++;
    }

    logger.info(`Bulk upserted ${count} forms for tenant: ${tenantId}`);
    return count;
  }

  /**
   * Get forms grouped by category
   * @param tenantId - Tenant ID
   */
  async getFormsGroupedByCategory(
    tenantId: string
  ): Promise<Record<string, IFormPermission[]>> {
    const forms = await this.getForms(tenantId);
    const grouped: Record<string, IFormPermission[]> = {};

    forms.forEach(form => {
      if (!grouped[form.formCategory]) {
        grouped[form.formCategory] = [];
      }
      grouped[form.formCategory].push(form);
    });

    return grouped;
  }

  /**
   * Get form statistics
   * @param tenantId - Tenant ID
   */
  async getStatistics(tenantId: string): Promise<{
    total: number;
    byCategory: Record<string, number>;
    byModule: Record<string, number>;
  }> {
    const forms = await this.getForms(tenantId);

    const byCategory: Record<string, number> = {};
    const byModule: Record<string, number> = {};

    forms.forEach(form => {
      // Count by category
      byCategory[form.formCategory] = (byCategory[form.formCategory] || 0) + 1;

      // Count by module
      if (form.module) {
        byModule[form.module] = (byModule[form.module] || 0) + 1;
      }
    });

    return {
      total: forms.length,
      byCategory,
      byModule,
    };
  }
}

// Export singleton instance
export const formPermissionService = new FormPermissionService();

