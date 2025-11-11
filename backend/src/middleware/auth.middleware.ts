import { Response, NextFunction } from 'express';
import { TenantRequest, UserRole } from '../types';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/appError';
import { getMasterConnection } from '../config/database';
import { UserSchema } from '../models/user.model';
import { logger } from '../utils/logger';

/**
 * Authenticate user via JWT token
 */
export const authenticate = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyAccessToken(token);

    // Verify token belongs to current tenant
    if (req.tenant && decoded.tenantId !== req.tenant.id) {
      throw new ForbiddenError('Invalid token for this tenant');
    }

    // Get user from database to ensure still active
    const masterConn = await getMasterConnection();
    const User = masterConn.model('User', UserSchema);

    const user = await User.findById(decoded.id);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedError('User account is not active');
    }

    // Attach user to request
    req.user = {
      id: user._id.toString(),
      tenantId: user.tenantId.toString(),
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    };

    logger.debug(`User authenticated: ${user.email} (${user.role})`);

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize user based on roles
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: TenantRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }

    const userRole = req.user.role as UserRole;

    // Owner has access to everything
    if (userRole === UserRole.OWNER) {
      return next();
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(userRole)) {
      return next(
        new ForbiddenError(
          `This action requires one of these roles: ${allowedRoles.join(', ')}`
        )
      );
    }

    next();
  };
};

/**
 * Check specific permission
 */
export const requirePermission = (permission: string) => {
  return (req: TenantRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }

    // Owner has all permissions
    if (req.user.role === UserRole.OWNER) {
      return next();
    }

    // Check if user has the required permission
    if (!req.user.permissions.includes(permission) && !req.user.permissions.includes('*')) {
      return next(
        new ForbiddenError(`Missing permission: ${permission}`)
      );
    }

    next();
  };
};

/**
 * Optional authentication (doesn't fail if no token)
 */
export const optionalAuth = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    const masterConn = await getMasterConnection();
    const User = masterConn.model('User', UserSchema);

    const user = await User.findById(decoded.id);

    if (user && user.status === 'active') {
      req.user = {
        id: user._id.toString(),
        tenantId: user.tenantId.toString(),
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      };
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
};

