import { Response, NextFunction } from 'express';
import { TenantRequest } from '../types';
import { getMasterConnection, getTenantConnection } from '../config/database';
import { TenantSchema } from '../models/tenant.model';
import { 
  TenantNotFoundError, 
  TenantSuspendedError, 
  SubscriptionExpiredError,
  LimitExceededError,
  AppError
} from '../utils/appError';
import { logger } from '../utils/logger';

/**
 * Resolve tenant from subdomain or custom domain
 */
export const resolveTenant = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const host = req.get('host') || '';
    let subdomain: string;

    // In development, allow tenant to be passed via header or query
    if (process.env.NODE_ENV === 'development') {
      subdomain =
        (req.get('X-Tenant') as string) ||
        (req.query.tenant as string) ||
        host.split('.')[0];
    } else {
      // In production, extract from subdomain
      const parts = host.split('.');
      
      // For custom domains, need to lookup in database
      // For now, use subdomain pattern
      if (parts.length < 2) {
        throw new AppError('Invalid host format', 400, 'INVALID_HOST');
      }
      
      subdomain = parts[0];
    }

    if (!subdomain) {
      throw new AppError('Tenant not specified', 400, 'TENANT_NOT_SPECIFIED');
    }

    // Get tenant from master database
    const masterConn = await getMasterConnection();
    const Tenant = masterConn.model('Tenant', TenantSchema);

    const tenant = await Tenant.findOne({
      $or: [{ subdomain }, { customDomain: host }],
    });

    if (!tenant) {
      throw new TenantNotFoundError();
    }

    // Check tenant status
    if (tenant.status === 'suspended') {
      throw new TenantSuspendedError();
    }

    if (tenant.status === 'deleted') {
      throw new TenantNotFoundError();
    }

    // Check subscription status
    if (
      tenant.subscription.status !== 'active' &&
      tenant.subscription.status !== 'trial'
    ) {
      throw new SubscriptionExpiredError();
    }

    // Check if trial is expired
    if (tenant.isTrialExpired()) {
      throw new SubscriptionExpiredError();
    }

    // Get tenant database connection
    const tenantConn = await getTenantConnection(tenant._id.toString(), tenant.dbName);

    // Attach tenant to request
    req.tenant = {
      id: tenant._id.toString(),
      name: tenant.name,
      subdomain: tenant.subdomain,
      dbName: tenant.dbName,
      connection: tenantConn,
      features: tenant.features,
      limits: tenant.limits,
      subscription: {
        plan: tenant.subscription.plan,
        status: tenant.subscription.status,
      },
    };

    logger.debug(`Tenant resolved: ${tenant.subdomain} (${tenant.dbName})`);

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if tenant has specific feature enabled
 */
export const requireFeature = (feature: string) => {
  return (req: TenantRequest, res: Response, next: NextFunction): void => {
    if (!req.tenant) {
      return next(new AppError('Tenant context not found', 500));
    }

    if (!req.tenant.features[feature]) {
      return next(
        new AppError(
          `Feature '${feature}' is not enabled for this tenant`,
          403,
          'FEATURE_NOT_ENABLED'
        )
      );
    }

    next();
  };
};

/**
 * Check if tenant has reached usage limit
 */
export const checkUsageLimit = (resource: string) => {
  return async (req: TenantRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.tenant) {
        throw new AppError('Tenant context not found', 500);
      }

      // Get current usage from master database
      const masterConn = await getMasterConnection();
      const Tenant = masterConn.model('Tenant', TenantSchema);

      const tenant = await Tenant.findById(req.tenant.id);

      if (!tenant) {
        throw new TenantNotFoundError();
      }

      const usage = tenant.usage[resource] || 0;
      const limit = tenant.limits[resource] || 0;

      if (usage >= limit) {
        throw new LimitExceededError(resource, limit, usage);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Increment usage counter for a resource
 */
export const incrementUsage = async (
  tenantId: string,
  resource: string,
  amount = 1
): Promise<void> => {
  try {
    const masterConn = await getMasterConnection();
    const Tenant = masterConn.model('Tenant', TenantSchema);

    await Tenant.updateOne(
      { _id: tenantId },
      {
        $inc: { [`usage.${resource}`]: amount },
        updatedAt: new Date(),
      }
    );

    logger.debug(`Incremented usage for tenant ${tenantId}: ${resource} +${amount}`);
  } catch (error) {
    logger.error('Failed to increment usage:', error);
    // Don't throw - usage tracking failure shouldn't block operations
  }
};

