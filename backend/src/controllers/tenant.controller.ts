import { Request, Response, NextFunction } from 'express';
import { tenantService } from '../services/tenant.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';
import { auditService } from '../services/audit.service';
import { AuditAction } from '../models/auditLog.model';

export class TenantController {
  /**
   * Register new tenant
   * POST /api/tenants/register
   */
  register = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { name, subdomain, email, password, firstName, lastName, phone } = req.body;

    const result = await tenantService.register({
      name,
      subdomain,
      email,
      password,
      firstName,
      lastName,
      phone,
    });

    sendSuccess(
      res,
      {
        tenant: {
          id: result.tenant._id,
          name: result.tenant.name,
          subdomain: result.tenant.subdomain,
          url: `https://${result.tenant.subdomain}.${process.env.APP_DOMAIN || 'genzirms.com'}`,
        },
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      'Tenant registered successfully. Welcome to Genzi RMS!',
      201
    );
  });

  /**
   * Check subdomain availability
   * GET /api/tenants/check-subdomain/:subdomain
   */
  checkSubdomain = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { subdomain } = req.params;

    const available = await tenantService.checkSubdomainAvailability(subdomain);

    sendSuccess(res, { available, subdomain });
  });

  /**
   * Get tenant by ID
   * GET /api/tenants/:id
   */
  getById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const tenant = await tenantService.getById(id);
    sendSuccess(res, { tenant }, 'Tenant retrieved successfully');
  });

  /**
   * Update tenant
   * PUT /api/tenants/:id
   */
  update = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const tenant = await tenantService.update(id, req.body);
    sendSuccess(res, { tenant }, 'Tenant updated successfully');
  });

  /**
   * Update tenant limits
   * PATCH /api/tenants/:id/limits
   */
  updateLimits = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const limits = req.body?.limits ?? req.body;

    const before = await tenantService.getById(id);
    const tenant = await tenantService.updateLimits(id, limits);

    const changes = Object.entries(limits).map(([key, value]) => ({
      field: `limits.${key}`,
      oldValue: (before.limits as any)[key],
      newValue: value,
    })).filter((change) => change.oldValue !== change.newValue);

    await auditService.log({
      tenantId: id,
      userId: req.user?.id,
      action: 'update',
      entityType: 'Tenant',
      entityId: id,
      entityName: tenant.name,
      changes: changes.length ? changes : undefined,
      metadata: {
        section: 'limits',
        payload: limits,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    sendSuccess(res, { tenant }, 'Tenant limits updated successfully');
  });

  /**
   * Update tenant plan/features
   * PATCH /api/tenants/:id/plan
   */
  updatePlan = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const before = await tenantService.getById(id);
    const tenant = await tenantService.updatePlan(id, req.body);

    const changes = [
      ...(req.body.plan && req.body.plan !== before.subscription.plan
        ? [{
            field: 'subscription.plan',
            oldValue: before.subscription.plan,
            newValue: req.body.plan,
          }]
        : []),
      ...(req.body.billingCycle && req.body.billingCycle !== before.subscription.billingCycle
        ? [{
            field: 'subscription.billingCycle',
            oldValue: before.subscription.billingCycle,
            newValue: req.body.billingCycle,
          }]
        : []),
      ...(req.body.status && req.body.status !== before.subscription.status
        ? [{
            field: 'subscription.status',
            oldValue: before.subscription.status,
            newValue: req.body.status,
          }]
        : []),
      ...(req.body.features
        ? Object.entries(req.body.features).map(([key, value]) => ({
            field: `features.${key}`,
            oldValue: (before.features as any)[key],
            newValue: value,
          }))
        : []),
    ].filter((change) => change.oldValue !== change.newValue);

    await auditService.log({
      tenantId: id,
      userId: req.user?.id,
      action: 'update',
      entityType: 'Tenant',
      entityId: id,
      entityName: tenant.name,
      changes: changes.length ? changes : undefined,
      metadata: {
        section: 'subscription',
        payload: req.body,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    sendSuccess(res, { tenant }, 'Tenant plan updated successfully');
  });

  /**
   * Get tenant usage
   * GET /api/tenants/:id/usage
   */
  getUsage = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const usage = await tenantService.getUsage(id);
    sendSuccess(res, usage, 'Usage statistics retrieved successfully');
  });

  /**
   * Suspend tenant
   * PATCH /api/tenants/:id/suspend
   */
  suspend = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const { reason, effectiveAt } = req.body || {};

    const before = await tenantService.getById(id);
    const tenant = await tenantService.suspend(id, {
      reason,
      effectiveAt: effectiveAt ? new Date(effectiveAt) : undefined,
      suspendedBy: req.user?.id,
    });

    await auditService.log({
      tenantId: id,
      userId: req.user?.id,
      action: 'status_change' as AuditAction,
      entityType: 'Tenant',
      entityId: id,
      entityName: tenant.name,
      changes: [
        {
          field: 'status',
          oldValue: before.status,
          newValue: tenant.status,
        },
        ...(reason
          ? [{
              field: 'suspendReason',
              oldValue: before.suspendReason,
              newValue: reason,
            }]
          : []),
      ],
      metadata: {
        reason,
        effectiveAt: tenant.suspendedAt,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    sendSuccess(res, { tenant }, 'Tenant suspended successfully');
  });

  /**
   * Activate tenant
   * PATCH /api/tenants/:id/activate
   */
  activate = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const before = await tenantService.getById(id);
    const tenant = await tenantService.activate(id, {
      reactivatedBy: req.user?.id,
    });

    await auditService.log({
      tenantId: id,
      userId: req.user?.id,
      action: 'status_change' as AuditAction,
      entityType: 'Tenant',
      entityId: id,
      entityName: tenant.name,
      changes: [
        {
          field: 'status',
          oldValue: before.status,
          newValue: tenant.status,
        },
      ],
      metadata: {
        reactivatedAt: tenant.reactivatedAt,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    sendSuccess(res, { tenant }, 'Tenant activated successfully');
  });
}

export const tenantController = new TenantController();

