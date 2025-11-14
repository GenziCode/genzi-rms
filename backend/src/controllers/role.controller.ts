import { Response } from 'express';
import { TenantRequest } from '../types';
import { roleService } from '../services/role.service';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';
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
}

export const roleController = new RoleController();

