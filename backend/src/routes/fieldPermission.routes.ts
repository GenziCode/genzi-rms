import { Router } from 'express';
import { fieldPermissionController } from '../controllers/fieldPermission.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/field-permissions/forms/:formName
 * Get all field permissions for a form
 */
router.get('/forms/:formName', fieldPermissionController.getFieldsForForm);

/**
 * GET /api/field-permissions/forms/:formName/user
 * Get field permissions for current user
 */
router.get('/forms/:formName/user', fieldPermissionController.getUserFieldsForForm);

/**
 * GET /api/field-permissions/check/:formName/:controlName
 * Check if user can edit a field
 */
router.get('/check/:formName/:controlName', fieldPermissionController.checkFieldAccess);

/**
 * POST /api/field-permissions
 * Create or update field permission (admin only)
 */
router.post(
  '/',
  requirePermission('settings:update'), // Only admins can manage field permissions
  fieldPermissionController.upsertField
);

/**
 * POST /api/field-permissions/bulk
 * Bulk create/update field permissions (admin only)
 */
router.post(
  '/bulk',
  requirePermission('settings:update'),
  fieldPermissionController.bulkUpsertFields
);

export default router;

