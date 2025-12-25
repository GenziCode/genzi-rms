import { Router } from 'express';
import { CategoryBulkOperationsController } from '../controllers/categoryBulkOperations.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { requireFormAccess } from '../middleware/formPermission.middleware';
import { validate } from '../middleware/validation.middleware';
import { body, query } from 'express-validator';

const router = Router();
const categoryBulkOpsController = new CategoryBulkOperationsController();

// All routes require authentication and tenant resolution
router.use(authenticate);
router.use(resolveTenant);
router.use(requireFormAccess('frmDefCategory'));

// Validation rules
const categoryIdsValidation = [
  body('categoryIds')
    .isArray({ min: 1 })
    .withMessage('Category IDs must be a non-empty array'),
  body('categoryIds.*')
    .isMongoId()
    .withMessage('Each category ID must be a valid MongoDB ID'),
];

const bulkUpdateValidation = [
  ...categoryIdsValidation,
  body('updateData')
    .isObject()
    .withMessage('Update data must be an object'),
  body('updateData.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('updateData.description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('updateData.color')
    .optional()
    .trim()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color code'),
  body('updateData.icon')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('Icon cannot exceed 10 characters'),
  body('updateData.sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a positive integer'),
  body('updateData.isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

const bulkAssignParentValidation = [
  ...categoryIdsValidation,
  body('parentId')
    .isMongoId()
    .withMessage('Parent ID must be a valid MongoDB ID'),
];

const bulkUpdateSortOrderValidation = [
  body('updates')
    .isArray({ min: 1 })
    .withMessage('Updates must be a non-empty array'),
  body('updates.*.id')
    .isMongoId()
    .withMessage('Each update must have a valid category ID'),
  body('updates.*.sortOrder')
    .isInt({ min: 0 })
    .withMessage('Sort order must be a positive integer'),
];

const bulkAssignColorAndIconValidation = [
  ...categoryIdsValidation,
  body('color')
    .optional()
    .trim()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color code'),
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('Icon cannot exceed 10 characters'),
];

const bulkSelectValidation = [
  query('categoryIds')
    .isArray({ min: 1 })
    .withMessage('Category IDs must be a non-empty array'),
  query('categoryIds.*')
    .isMongoId()
    .withMessage('Each category ID must be a valid MongoDB ID'),
  query('action')
    .optional()
    .isIn(['select', 'deselect'])
    .withMessage('Action must be select or deselect'),
];

/**
 * Category Bulk Operations Routes
 */

// POST /api/categories/bulk-update - Bulk update categories
router.post(
  '/bulk-update',
  bulkUpdateValidation,
  validate,
  categoryBulkOpsController.bulkUpdate
);

// POST /api/categories/bulk-activate - Bulk activate categories
router.post(
  '/bulk-activate',
  categoryIdsValidation,
  validate,
  categoryBulkOpsController.bulkActivate
);

// POST /api/categories/bulk-deactivate - Bulk deactivate categories
router.post(
  '/bulk-deactivate',
  categoryIdsValidation,
  validate,
  categoryBulkOpsController.bulkDeactivate
);

// POST /api/categories/bulk-delete - Bulk delete categories
router.post(
  '/bulk-delete',
  categoryIdsValidation,
  validate,
  categoryBulkOpsController.bulkDelete
);

// POST /api/categories/bulk-assign-parent - Bulk assign parent to categories
router.post(
  '/bulk-assign-parent',
  bulkAssignParentValidation,
  validate,
  categoryBulkOpsController.bulkAssignParent
);

// POST /api/categories/bulk-update-sort-order - Bulk update sort order
router.post(
  '/bulk-update-sort-order',
  bulkUpdateSortOrderValidation,
  validate,
  categoryBulkOpsController.bulkUpdateSortOrder
);

// POST /api/categories/bulk-assign-color-icon - Bulk assign color and icon
router.post(
  '/bulk-assign-color-icon',
  bulkAssignColorAndIconValidation,
  validate,
  categoryBulkOpsController.bulkAssignColorAndIcon
);

// GET /api/categories/bulk-select - Bulk select categories (helper endpoint)
router.get(
  '/bulk-select',
  bulkSelectValidation,
  validate,
  categoryBulkOpsController.bulkSelect
);

export default router;