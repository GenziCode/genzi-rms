import { Router } from 'express';
import { formPermissionController } from '../controllers/formPermission.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/form-permissions
 * Get all forms for current tenant
 */
router.get('/', formPermissionController.getForms);

/**
 * GET /api/form-permissions/categories
 * Get forms grouped by category
 */
router.get('/categories', formPermissionController.getFormsByCategory);

/**
 * GET /api/form-permissions/modules
 * Get forms by module (optional query param: ?module=product)
 */
router.get('/modules', formPermissionController.getFormsByModule);

/**
 * GET /api/form-permissions/statistics
 * Get form permission statistics
 */
router.get('/statistics', formPermissionController.getStatistics);

/**
 * GET /api/form-permissions/config
 * Get forms configuration (for reference)
 */
router.get('/config', formPermissionController.getConfig);

/**
 * GET /api/form-permissions/check/:formName
 * Check if current user has access to a form
 */
router.get('/check/:formName', formPermissionController.checkFormAccess);

/**
 * GET /api/form-permissions/check-bulk?formNames=frmProductFields,frmMembershipInfo
 * Check access for multiple forms
 */
router.get('/check-bulk', formPermissionController.checkBulkFormAccess);

/**
 * GET /api/form-permissions/:formName
 * Get specific form by name
 */
router.get('/:formName', formPermissionController.getFormByName);

/**
 * POST /api/form-permissions/sync
 * Sync forms from configuration (admin only)
 */
router.post(
  '/sync',
  requirePermission('settings:update'), // Only admins can sync
  formPermissionController.syncForms
);

export default router;

