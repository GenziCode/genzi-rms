import { Response, NextFunction } from 'express';
import { TenantRequest, UserRole } from '../types';
import { ForbiddenError } from '../utils/appError';
import { logger } from '../utils/logger';
import { formPermissionService } from '../services/formPermission.service';
import { getFormByRoute } from '../config/forms.config';

/**
 * Middleware to check form-level permissions
 * @param formName - Form name to check (e.g., 'frmProductFields')
 */
export const requireFormAccess = (formName: string) => {
  return async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.tenant) {
        return next(new ForbiddenError('Authentication required'));
      }

      // Owner has access to everything
      if (req.user.role === UserRole.OWNER) {
        logger.debug(`Form access granted (OWNER): ${formName} for user: ${req.user.email}`);
        return next();
      }

      const hasAccess = await formPermissionService.hasFormAccess(
        req.user.tenantId,
        req.user.id,
        formName
      );

      if (!hasAccess) {
        logger.warn(
          `Form access denied: ${formName} for user: ${req.user.email}`
        );
        return next(
          new ForbiddenError(
            `Access denied: You do not have permission to access '${formName}'`
          )
        );
      }

      logger.debug(`Form access granted: ${formName} for user: ${req.user.email}`);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check route-level permissions
 * Automatically maps routes to forms
 */
export const requireRouteAccess = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.tenant) {
      return next(new ForbiddenError('Authentication required'));
    }

    // Owner has access to everything
    if (req.user.role === UserRole.OWNER) {
      logger.debug(`Route access granted (OWNER): ${req.method} ${req.path} for user: ${req.user.email}`);
      return next();
    }

    const route = req.route?.path || req.path;
    const method = req.method;

    // Try to get form from route mapping
    const form = getFormByRoute(route, method);

    if (!form) {
      // No form mapping found - allow access (backward compatibility)
      // In production, you might want to log this for mapping
      logger.debug(`No form mapping for route: ${method} ${route}`);
      return next();
    }

    const hasAccess = await formPermissionService.hasFormAccess(
      req.user.tenantId,
      req.user.id,
      form.formName
    );

    if (!hasAccess) {
      logger.warn(
        `Route access denied: ${method} ${route} (form: ${form.formName}) for user: ${req.user.email}`
      );
      return next(
        new ForbiddenError(
          `Access denied: You do not have permission to access this resource`
        )
      );
    }

    logger.debug(
      `Route access granted: ${method} ${route} (form: ${form.formName}) for user: ${req.user.email}`
    );
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional form access check (doesn't fail if no access)
 * Useful for UI rendering decisions
 */
export const checkFormAccess = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.tenant) {
      // Attach false to request
      (req as any).hasFormAccess = false;
      return next();
    }

    const route = req.route?.path || req.path;
    const method = req.method;
    const form = getFormByRoute(route, method);

    if (!form) {
      (req as any).hasFormAccess = true; // Default to true if no mapping
      return next();
    }

    const hasAccess = await formPermissionService.hasFormAccess(
      req.user.tenantId,
      req.user.id,
      form.formName
    );

    (req as any).hasFormAccess = hasAccess;
    next();
  } catch (error) {
    // Don't fail, just set to false
    (req as any).hasFormAccess = false;
    next();
  }
};

