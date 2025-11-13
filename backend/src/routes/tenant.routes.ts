import { Router } from 'express';
import { tenantController } from '../controllers/tenant.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { auditMiddleware } from '../middleware/audit.middleware';
import {
  registerTenantValidation,
  checkSubdomainValidation,
  tenantIdParamValidation,
  updateTenantLimitsValidation,
  updateTenantPlanValidation,
  suspendTenantValidation,
} from '../validations/tenant.validations';

const router = Router();

/**
 * POST /api/tenants/register
 * Register new tenant
 */
router.post('/register', [...registerTenantValidation, validate], tenantController.register);

/**
 * GET /api/tenants/check-subdomain/:subdomain
 * Check subdomain availability
 */
router.get(
  '/check-subdomain/:subdomain',
  [...checkSubdomainValidation, validate],
  tenantController.checkSubdomain
);

// Authenticated routes below
router.use(authenticate);

/**
 * GET /api/tenants/:id
 */
router.get('/:id', [...tenantIdParamValidation, validate], tenantController.getById);

/**
 * PUT /api/tenants/:id
 */
router.put(
  '/:id',
  [...tenantIdParamValidation, validate],
  auditMiddleware({ action: 'update', entityType: 'tenant' }),
  tenantController.update
);

/**
 * PATCH /api/tenants/:id/limits
 */
router.patch(
  '/:id/limits',
  [...tenantIdParamValidation, ...updateTenantLimitsValidation, validate],
  tenantController.updateLimits
);

/**
 * PATCH /api/tenants/:id/plan
 */
router.patch(
  '/:id/plan',
  [...tenantIdParamValidation, ...updateTenantPlanValidation, validate],
  tenantController.updatePlan
);

/**
 * GET /api/tenants/:id/usage
 */
router.get('/:id/usage', [...tenantIdParamValidation, validate], tenantController.getUsage);

/**
 * PATCH /api/tenants/:id/suspend
 */
router.patch(
  '/:id/suspend',
  [...tenantIdParamValidation, ...suspendTenantValidation, validate],
  tenantController.suspend
);

/**
 * PATCH /api/tenants/:id/activate
 */
router.patch('/:id/activate', [...tenantIdParamValidation, validate], tenantController.activate);

export default router;
