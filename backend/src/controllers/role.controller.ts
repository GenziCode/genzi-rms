import { Response } from 'express';
import { TenantRequest } from '../types';
import { roleService } from '../services/role.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export class RoleController {
  /**
   * GET /api/roles
   * Get all roles
   */
  getRoles = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const roles = await roleService.getRoles(tenantId);
    sendSuccess(res, { roles });
  });

  /**
   * GET /api/roles/:id
   * Get role by ID
   */
  getRoleById = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id } = req.params;
    const role = await roleService.getRoleById(tenantId, id);
    sendSuccess(res, { role });
  });

  /**
   * POST /api/roles
   * Create role
   */
  createRole = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const role = await roleService.createRole(tenantId, req.body);
    sendSuccess(res, { role }, 'Role created successfully', 201);
  });

  /**
   * PUT /api/roles/:id
   * Update role
   */
  updateRole = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id } = req.params;
    const role = await roleService.updateRole(tenantId, id, req.body);
    sendSuccess(res, { role }, 'Role updated successfully');
  });

  /**
   * DELETE /api/roles/:id
   * Delete role
   */
  deleteRole = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const { id } = req.params;
    await roleService.deleteRole(tenantId, id);
    sendSuccess(res, null, 'Role deleted successfully');
  });

  /**
   * GET /api/roles/analytics
   * Get role analytics
   */
  getAnalytics = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const roles = await roleService.getRoles(tenantId, true);

    const analytics = {
      totalRoles: roles.length,
      activeRoles: roles.filter(r => r.isActive).length,
      systemRoles: roles.filter(r => r.isSystemRole).length,
      customRoles: roles.filter(r => !r.isSystemRole).length,
    };

    sendSuccess(res, analytics);
  });

  /**
   * GET /api/roles/distribution
   * Get role distribution by category
   */
  getDistribution = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const roles = await roleService.getRoles(tenantId, true);

    const distribution = roles.reduce<Record<string, number>>((acc, role) => {
      acc[role.category] = (acc[role.category] || 0) + 1;
      return acc;
    }, {});

    sendSuccess(res, { distribution });
  });

  /**
   * GET /api/roles/built-in
   * Get built-in system roles
   */
  getBuiltInRoles = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    const roles = await roleService.getRoles(tenantId, true);
    const builtInRoles = roles.filter(r => r.isSystemRole);
    sendSuccess(res, { roles: builtInRoles });
  });

  /**
   * POST /api/roles/initialize
   * Initialize default roles for tenant
   */
  initializeRoles = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { tenantId } = req.tenant!;
    await roleService.initializeDefaultRoles(tenantId);
    sendSuccess(res, null, 'Default roles initialized successfully');
  });
}

export const roleController = new RoleController();

