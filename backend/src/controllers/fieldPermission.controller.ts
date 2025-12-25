import { Response } from 'express';
import { TenantRequest } from '../types';
import { fieldPermissionService } from '../services/fieldPermission.service';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

export class FieldPermissionController {
  /**
   * GET /api/field-permissions/forms/:formName
   * Get all field permissions for a form
   */
  async getFieldsForForm(req: TenantRequest, res: Response): Promise<Response> {
    try {
      if (!req.user || !req.tenant) {
        return sendError(res, 'Authentication required', 401);
      }

      const { formName } = req.params;
      const fields = await fieldPermissionService.getFieldsForForm(
        req.user.tenantId,
        formName
      );

      return sendSuccess(res, {
        formName,
        fields,
        total: fields.length,
      });
    } catch (error: any) {
      logger.error('Error getting fields for form:', error);
      return sendError(res, error.message || 'Failed to get fields', 500);
    }
  }

  /**
   * GET /api/field-permissions/forms/:formName/user
   * Get field permissions for current user
   */
  async getUserFieldsForForm(req: TenantRequest, res: Response): Promise<Response> {
    try {
      if (!req.user || !req.tenant) {
        return sendError(res, 'Authentication required', 401);
      }

      const { formName } = req.params;
      const fields = await fieldPermissionService.getUserFieldsForForm(
        req.user.tenantId,
        req.user.id,
        formName
      );

      return sendSuccess(res, {
        formName,
        fields,
        total: fields.length,
      });
    } catch (error: any) {
      logger.error('Error getting user fields for form:', error);
      return sendError(res, error.message || 'Failed to get user fields', 500);
    }
  }

  /**
   * GET /api/field-permissions/check/:formName/:controlName
   * Check if user can edit a field
   */
  async checkFieldAccess(req: TenantRequest, res: Response): Promise<Response> {
    try {
      if (!req.user || !req.tenant) {
        return sendError(res, 'Authentication required', 401);
      }

      const { formName, controlName } = req.params;
      const canEdit = await fieldPermissionService.canEditField(
        req.user.tenantId,
        req.user.id,
        formName,
        controlName
      );

      return sendSuccess(res, {
        formName,
        controlName,
        canEdit,
      });
    } catch (error: any) {
      logger.error('Error checking field access:', error);
      return sendError(res, error.message || 'Failed to check field access', 500);
    }
  }

  /**
   * POST /api/field-permissions
   * Create or update field permission
   */
  async upsertField(req: TenantRequest, res: Response): Promise<Response> {
    try {
      if (!req.user || !req.tenant) {
        return sendError(res, 'Authentication required', 401);
      }

      // TODO: Add permission check (only admins can manage field permissions)

      const field = await fieldPermissionService.upsertField(req.user.tenantId, req.body);

      return sendSuccess(res, {
        field,
        message: 'Field permission updated successfully',
      });
    } catch (error: any) {
      logger.error('Error upserting field:', error);
      return sendError(res, error.message || 'Failed to update field permission', 500);
    }
  }

  /**
   * POST /api/field-permissions/bulk
   * Bulk create/update field permissions
   */
  async bulkUpsertFields(req: TenantRequest, res: Response): Promise<Response> {
    try {
      if (!req.user || !req.tenant) {
        return sendError(res, 'Authentication required', 401);
      }

      // TODO: Add permission check

      const { fields } = req.body;
      if (!Array.isArray(fields)) {
        return sendError(res, 'Fields must be an array', 400);
      }

      const count = await fieldPermissionService.bulkUpsertFields(
        req.user.tenantId,
        fields
      );

      return sendSuccess(res, {
        message: `Successfully updated ${count} field permissions`,
        count,
      });
    } catch (error: any) {
      logger.error('Error bulk upserting fields:', error);
      return sendError(res, error.message || 'Failed to update field permissions', 500);
    }
  }
}

export const fieldPermissionController = new FieldPermissionController();

