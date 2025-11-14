import { Response, NextFunction } from 'express';
import { TenantRequest } from '../types';
import { fieldPermissionService } from '../services/fieldPermission.service';
import { logger } from '../utils/logger';

/**
 * Middleware to filter response fields based on permissions
 * This middleware should be applied after the controller but before sending response
 */
export const filterResponseFields = (formName: string) => {
  return async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.tenant) {
        return next();
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to filter fields
      res.json = function (data: any) {
        if (!data || typeof data !== 'object') {
          return originalJson(data);
        }

        // Filter fields asynchronously
        fieldPermissionService
          .filterFields(req.user!.tenantId, req.user!.id, formName, data)
          .then(filtered => {
            originalJson(filtered);
          })
          .catch(error => {
            logger.error('Error filtering fields:', error);
            originalJson(data); // Return original data on error
          });

        return res;
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to filter array responses
 */
export const filterArrayResponseFields = (formName: string) => {
  return async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.tenant) {
        return next();
      }

      const originalJson = res.json.bind(res);

      res.json = function (data: any) {
        if (!Array.isArray(data)) {
          return originalJson(data);
        }

        // Filter each item in array
        Promise.all(
          data.map(item =>
            fieldPermissionService.filterFields(
              req.user!.tenantId,
              req.user!.id,
              formName,
              item
            )
          )
        )
          .then(filtered => {
            originalJson(filtered);
          })
          .catch(error => {
            logger.error('Error filtering array fields:', error);
            originalJson(data);
          });

        return res;
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Helper function to filter fields in controller
 */
export async function filterFieldsInController(
  tenantId: string,
  userId: string,
  formName: string,
  data: any
): Promise<any> {
  if (Array.isArray(data)) {
    return Promise.all(
      data.map(item =>
        fieldPermissionService.filterFields(tenantId, userId, formName, item)
      )
    );
  }
  return fieldPermissionService.filterFields(tenantId, userId, formName, data);
}

