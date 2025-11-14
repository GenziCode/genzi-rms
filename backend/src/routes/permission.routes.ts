import { Router } from 'express';
import { permissionService } from '../services/permission.service';
import { sendSuccess } from '../utils/response';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { Response } from 'express';
import { TenantRequest } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/permissions
 * Get all permissions
 */
router.get(
  '/',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const permissions = await permissionService.getAllPermissions();
    sendSuccess(res, { permissions });
  })
);

/**
 * GET /api/permissions/module/:module
 * Get permissions by module
 */
router.get(
  '/module/:module',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const { module } = req.params;
    const permissions = await permissionService.getPermissionsByModule(module);
    sendSuccess(res, { permissions });
  })
);

/**
 * GET /api/permissions/grouped
 * Get permissions grouped by module
 */
router.get(
  '/grouped',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const grouped = await permissionService.getPermissionsGroupedByModule();
    sendSuccess(res, { permissions: grouped });
  })
);

export default router;

