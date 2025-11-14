import mongoose from 'mongoose';
import { getMasterConnection } from '../config/database';
import { FieldPermissionSchema, IFieldPermission } from '../models/fieldPermission.model';
import { NotFoundError } from '../utils/appError';
import { logger } from '../utils/logger';
import { roleService } from './role.service';
import { permissionService } from './permission.service';

/**
 * Field Permission Service
 * Manages field-level permissions and access control
 */
export class FieldPermissionService {
  private fieldCache: Map<string, IFieldPermission[]> | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get FieldPermission model
   */
  private async getFieldPermissionModel() {
    const masterConn = await getMasterConnection();
    return (
      masterConn.models.FieldPermission ||
      masterConn.model<IFieldPermission>('FieldPermission', FieldPermissionSchema)
    );
  }

  /**
   * Clear field cache
   */
  clearCache(): void {
    this.fieldCache = null;
    this.cacheExpiry = 0;
    logger.debug('Field permission cache cleared');
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    return (
      this.fieldCache !== null &&
      Date.now() < this.cacheExpiry
    );
  }

  /**
   * Get all field permissions for a form
   * @param tenantId - Tenant ID
   * @param formName - Form name
   */
  async getFieldsForForm(
    tenantId: string,
    formName: string
  ): Promise<IFieldPermission[]> {
    const cacheKey = `${tenantId}:${formName}`;

    if (this.isCacheValid() && this.fieldCache?.has(cacheKey)) {
      logger.debug(`Returning fields from cache for form: ${formName}`);
      return this.fieldCache.get(cacheKey)!;
    }

    const FieldPermission = await this.getFieldPermissionModel();
    const fields = await FieldPermission.find({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      formName: formName,
    }).sort({ label: 1 });

    // Update cache
    if (!this.fieldCache) {
      this.fieldCache = new Map();
    }
    this.fieldCache.set(cacheKey, fields);
    this.cacheExpiry = Date.now() + this.CACHE_TTL;

    return fields;
  }

  /**
   * Get field permissions for a user
   * Filters based on user's permissions
   * @param tenantId - Tenant ID
   * @param userId - User ID
   * @param formName - Form name
   */
  async getUserFieldsForForm(
    tenantId: string,
    userId: string,
    formName: string
  ): Promise<IFieldPermission[]> {
    const allFields = await this.getFieldsForForm(tenantId, formName);
    const userPermissions = await roleService.getUserPermissions(tenantId, userId);

    // Check for wildcard permission
    if (permissionService.hasPermission(userPermissions, '*')) {
      return allFields;
    }

    // Filter fields based on permissions
    // For now, return all visible fields
    // In future, can add field-specific permissions like 'field:product:price:read'
    return allFields.filter(field => field.isVisible);
  }

  /**
   * Filter object fields based on permissions
   * @param tenantId - Tenant ID
   * @param userId - User ID
   * @param formName - Form name
   * @param data - Data object to filter
   */
  async filterFields(
    tenantId: string,
    userId: string,
    formName: string,
    data: Record<string, any>
  ): Promise<Record<string, any>> {
    const fields = await this.getUserFieldsForForm(tenantId, userId, formName);
    const filtered: Record<string, any> = {};

    fields.forEach(field => {
      if (!field.isVisible) {
        return; // Skip invisible fields
      }

      // Get value from field path or control name
      const value = field.fieldPath
        ? this.getNestedValue(data, field.fieldPath)
        : data[field.controlName];

      if (value !== undefined) {
        if (field.fieldPath) {
          this.setNestedValue(filtered, field.fieldPath, value);
        } else {
          filtered[field.controlName] = value;
        }
      } else if (field.defaultValue !== undefined) {
        // Use default value if field not in data
        if (field.fieldPath) {
          this.setNestedValue(filtered, field.fieldPath, field.defaultValue);
        } else {
          filtered[field.controlName] = field.defaultValue;
        }
      }
    });

    return filtered;
  }

  /**
   * Check if user can edit a field
   * @param tenantId - Tenant ID
   * @param userId - User ID
   * @param formName - Form name
   * @param controlName - Control/field name
   */
  async canEditField(
    tenantId: string,
    userId: string,
    formName: string,
    controlName: string
  ): Promise<boolean> {
    const userPermissions = await roleService.getUserPermissions(tenantId, userId);

    // Check for wildcard permission
    if (permissionService.hasPermission(userPermissions, '*')) {
      return true;
    }

    const fields = await this.getFieldsForForm(tenantId, formName);
    const field = fields.find(f => f.controlName === controlName);

    if (!field) {
      return false; // Field doesn't exist
    }

    return field.isVisible && field.isEditable;
  }

  /**
   * Get nested value from object using dot notation path
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set nested value in object using dot notation path
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Create or update field permission
   */
  async upsertField(
    tenantId: string,
    data: {
      formName: string;
      controlName: string;
      controlType?: string;
      fieldPath?: string;
      label: string;
      isVisible?: boolean;
      isEditable?: boolean;
      isRequired?: boolean;
      defaultValue?: any;
      validationRules?: any;
    }
  ): Promise<IFieldPermission> {
    const FieldPermission = await this.getFieldPermissionModel();

    const field = await FieldPermission.findOneAndUpdate(
      {
        tenantId: new mongoose.Types.ObjectId(tenantId),
        formName: data.formName,
        controlName: data.controlName,
      },
      {
        ...data,
        tenantId: new mongoose.Types.ObjectId(tenantId),
      },
      {
        upsert: true,
        new: true,
      }
    );

    this.clearCache();
    logger.info(`Upserted field: ${data.controlName} for form: ${data.formName}`);
    return field;
  }

  /**
   * Bulk create/update fields
   */
  async bulkUpsertFields(
    tenantId: string,
    fields: Array<{
      formName: string;
      controlName: string;
      controlType?: string;
      fieldPath?: string;
      label: string;
      isVisible?: boolean;
      isEditable?: boolean;
      isRequired?: boolean;
      defaultValue?: any;
      validationRules?: any;
    }>
  ): Promise<number> {
    let count = 0;
    for (const fieldData of fields) {
      await this.upsertField(tenantId, fieldData);
      count++;
    }
    logger.info(`Bulk upserted ${count} fields for tenant: ${tenantId}`);
    return count;
  }
}

// Export singleton instance
export const fieldPermissionService = new FieldPermissionService();

