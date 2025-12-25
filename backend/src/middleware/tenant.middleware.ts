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
    
    // For IP-based access (public IP), we'll implement a fallback mechanism
    if (host === 'localhost' ||
        host.startsWith('192.168.') ||
        host.match(/^\d+\.\d+\.\d+\.\d+/) ||  // matches IP addresses like 39.39.213.253
        host.includes('localhost')) {
      // For IP-based access, find the first active tenant as a fallback
      const masterConn = await getMasterConnection();
      const TenantModel = masterConn.model('Tenant', TenantSchema);
      
      const defaultTenant = await TenantModel.findOne({
        status: 'active'
      }).sort({ createdAt: 1 }).lean();
      
      if (!defaultTenant) {
        throw new TenantNotFoundError();
      }
      
      // Get tenant database connection
      const tenantConn = await getTenantConnection(defaultTenant._id.toString(), defaultTenant.dbName as string);
      
      // Attach tenant to request
      req.tenant = {
        id: defaultTenant._id.toString(),
        tenantId: defaultTenant._id.toString(),
        name: defaultTenant.name as string,
        subdomain: defaultTenant.subdomain as string,
        dbName: defaultTenant.dbName as string,
        connection: tenantConn,
        features: defaultTenant.features as Record<string, boolean>,
        limits: defaultTenant.limits as Record<string, number>,
        subscription: {
          plan: defaultTenant.subscription.plan as string,
          status: defaultTenant.subscription.status as string,
        },
      };
      
      logger.debug(`Default tenant resolved for IP access: ${defaultTenant.subdomain} (${defaultTenant.dbName})`);
      
      next();
      return;
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

    // Check if trial is expired - using manual check instead of method
    if (tenant.subscription.status === 'trial' && tenant.subscription.trialEndDate) {
      const isExpired = new Date() > new Date(tenant.subscription.trialEndDate as Date);
      if (isExpired) {
        throw new SubscriptionExpiredError();
      }
    }

    // Get tenant database connection
    const tenantConn = await getTenantConnection(tenant._id.toString(), tenant.dbName as string);

    // Attach tenant to request
    req.tenant = {
      id: tenant._id.toString(),
      tenantId: tenant._id.toString(),
      name: tenant.name as string,
      subdomain: tenant.subdomain as string,
      dbName: tenant.dbName as string,
      connection: tenantConn,
      features: tenant.features as Record<string, boolean>,
      limits: tenant.limits as Record<string, number>,
      subscription: {
        plan: tenant.subscription.plan as string,
        status: tenant.subscription.status as string,
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

      // Use different variable names to avoid redeclaration
      const resourceUsage = (tenant.usage as Record<string, number>)[resource] || 0;
      const resourceLimit = (tenant.limits as Record<string, number>)[resource] || 0;
  
      if (resourceUsage >= resourceLimit) {
        throw new LimitExceededError(resource, resourceLimit, resourceUsage);
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
