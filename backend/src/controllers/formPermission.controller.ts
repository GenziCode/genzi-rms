import { Request, Response } from 'express';
import { TenantRequest } from '../types';
import { formPermissionService } from '../services/formPermission.service';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';
import { FORMS_CONFIG, getAllCategories, getAllModules } from '../config/forms.config';

export class FormPermissionController {
  /**
   * GET /api/form-permissions
   * Get all forms for current tenant
   */
  async getForms(req: TenantRequest, res: Response): Promise<Response> {
    try {
      if (!req.user || !req.tenant) {
        return sendError(res, 'Authentication required', 401);
      }

      const forms = await formPermissionService.getForms(req.user.tenantId);

      return sendSuccess(res, {
        forms,
        total: forms.length,
      });
    } catch (error: any) {
      logger.error('Error getting forms:', error);
      return sendError(res, error.message || 'Failed to get forms', 500);
    }
  }

  /**
   * GET /api/form-permissions/categories
   * Get forms grouped by category
   */
  async getFormsByCategory(req: TenantRequest, res: Response): Promise<Response> {
    try {
      if (!req.user || !req.tenant) {
        return sendError(res, 'Authentication required', 401);
      }

      const grouped = await formPermissionService.getFormsGroupedByCategory(
        req.user.tenantId
      );

      return sendSuccess(res, {
        categories: grouped,
        totalCategories: Object.keys(grouped).length,
        totalForms: Object.values(grouped).reduce((sum, forms) => sum + forms.length, 0),
      });
    } catch (error: any) {
      logger.error('Error getting forms by category:', error);
      return sendError(res, error.message || 'Failed to get forms by category', 500);
    }
  }

  /**
   * GET /api/form-permissions/modules
   * Get forms grouped by module
   */
  async getFormsByModule(req: TenantRequest, res: Response): Promise<Response> {
    try {
      if (!req.user || !req.tenant) {
        return sendError(res, 'Authentication required', 401);
      }

      const module = req.query.module as string;
      const forms = module
        ? await formPermissionService.getFormsByModule(req.user.tenantId, module)
        : await formPermissionService.getForms(req.user.tenantId);

      return sendSuccess(res, {
        forms,
        module: module || 'all',
        total: forms.length,
      });
    } catch (error: any) {
      logger.error('Error getting forms by module:', error);
      return sendError(res, error.message || 'Failed to get forms by module', 500);
    }
  }

  /**
   * GET /api/form-permissions/:formName
   * Get specific form by name
   */
  async getFormByName(req: TenantRequest, res: Response): Promise<Response> {
    try {
      if (!req.user || !req.tenant) {
        return sendError(res, 'Authentication required', 401);
      }

      const { formName } = req.params;
      const form = await formPermissionService.getFormByName(
        req.user.tenantId,
        formName
      );

      if (!form) {
        return sendError(res, 'Form not found', 404);
      }

      return sendSuccess(res, { form });
    } catch (error: any) {
      logger.error('Error getting form:', error);
      return sendError(res, error.message || 'Failed to get form', 500);
    }
  }

  /**
   * GET /api/form-permissions/check/:formName
   * Check if current user has access to a form
   */
  async checkFormAccess(req: TenantRequest, res: Response): Promise<Response> {
    try {
      if (!req.user || !req.tenant) {
        return sendError(res, 'Authentication required', 401);
      }

      const { formName } = req.params;
      const hasAccess = await formPermissionService.hasFormAccess(
        req.user.tenantId,
        req.user.id,
        formName
      );

      return sendSuccess(res, {
        formName,
        hasAccess,
      });
    } catch (error: any) {
      logger.error('Error checking form access:', error);
      return sendError(res, error.message || 'Failed to check form access', 500);
    }
  }

  /**
   * GET /api/form-permissions/check-bulk
   * Check access for multiple forms
   */
  async checkBulkFormAccess(req: TenantRequest, res: Response): Promise<Response> {
    try {
      if (!req.user || !req.tenant) {
        return sendError(res, 'Authentication required', 401);
      }

      const { formNames } = req.query;
      if (!formNames || typeof formNames !== 'string') {
        return sendError(res, 'formNames query parameter required', 400);
      }

      const names = formNames.split(',');
      const results: Record<string, boolean> = {};

      await Promise.all(
        names.map(async (formName) => {
          const hasAccess = await formPermissionService.hasFormAccess(
            req.user.tenantId,
            req.user.id,
            formName.trim()
          );
          results[formName.trim()] = hasAccess;
        })
      );

      return sendSuccess(res, { access: results });
    } catch (error: any) {
      logger.error('Error checking bulk form access:', error);
      return sendError(res, error.message || 'Failed to check bulk form access', 500);
    }
  }

  /**
   * GET /api/form-permissions/statistics
   * Get form permission statistics
   */
  async getStatistics(req: TenantRequest, res: Response): Promise<Response> {
    try {
      if (!req.user || !req.tenant) {
        return sendError(res, 'Authentication required', 401);
      }

      const stats = await formPermissionService.getStatistics(req.user.tenantId);

      return sendSuccess(res, {
        statistics: stats,
        availableCategories: getAllCategories(),
        availableModules: getAllModules(),
      });
    } catch (error: any) {
      logger.error('Error getting form statistics:', error);
      return sendError(res, error.message || 'Failed to get statistics', 500);
    }
  }

  /**
   * POST /api/form-permissions/sync
   * Sync forms from configuration (admin only)
   */
  async syncForms(req: TenantRequest, res: Response): Promise<Response> {
    try {
      if (!req.user || !req.tenant) {
        return sendError(res, 'Authentication required', 401);
      }

      // Check if user has admin permission
      // TODO: Add proper permission check

      const count = await formPermissionService.bulkUpsertForms(
        req.user.tenantId,
        FORMS_CONFIG.map((form) => ({
          formName: form.formName,
          formCaption: form.formCaption,
          formCategory: form.formCategory,
          module: form.module,
          route: form.route,
          httpMethods: form.httpMethods,
        }))
      );

      logger.info(`Synced ${count} forms for tenant: ${req.user.tenantId}`);

      return sendSuccess(res, {
        message: `Successfully synced ${count} forms`,
        synced: count,
      });
    } catch (error: any) {
      logger.error('Error syncing forms:', error);
      return sendError(res, error.message || 'Failed to sync forms', 500);
    }
  }

  /**
   * GET /api/form-permissions/config
   * Get forms configuration (for reference)
   */
  async getConfig(req: TenantRequest, res: Response): Promise<Response> {
    try {
      return sendSuccess(res, {
        forms: FORMS_CONFIG,
        total: FORMS_CONFIG.length,
        categories: getAllCategories(),
        modules: getAllModules(),
      });
    } catch (error: any) {
      logger.error('Error getting forms config:', error);
      return sendError(res, error.message || 'Failed to get forms config', 500);
    }
  }
}

export const formPermissionController = new FormPermissionController();

