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

/**
 * GET /api/roles/analytics
 * Get role analytics
 */
router.get('/analytics', roleController.getAnalytics);

/**
 * GET /api/roles/distribution
 * Get role distribution by category
 */
router.get('/distribution', roleController.getDistribution);

/**
 * GET /api/roles/built-in
 * Get built-in system roles
 */
router.get('/built-in', roleController.getBuiltInRoles);

/**
 * POST /api/roles/initialize
 * Initialize default roles for tenant (requires role:create permission)
 */
router.post('/initialize', requirePermission('role:create'), roleController.initializeRoles);

export default router;

