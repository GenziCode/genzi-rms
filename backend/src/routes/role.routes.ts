import { Router } from 'express';
import { roleController } from '../controllers/role.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// All role routes require role management permission
router.use(requirePermission('role:read'));

/**
 * GET /api/roles
 * Get all roles
 */
router.get('/', roleController.getRoles);

/**
 * GET /api/roles/:id
 * Get role by ID
 */
router.get('/:id', roleController.getRoleById);

/**
 * POST /api/roles
 * Create role (requires role:create permission)
 */
router.post('/', requirePermission('role:create'), roleController.createRole);

/**
 * PUT /api/roles/:id
 * Update role (requires role:update permission)
 */
router.put('/:id', requirePermission('role:update'), roleController.updateRole);

/**
 * DELETE /api/roles/:id
 * Delete role (requires role:delete permission)
 */
router.delete('/:id', requirePermission('role:delete'), roleController.deleteRole);

export default router;

