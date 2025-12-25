import { Router, Request, Response, NextFunction } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { CategoryApprovalController } from '../controllers/categoryApproval.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { auditMiddleware } from '../middleware/audit.middleware';
import { requireFormAccess } from '../middleware/formPermission.middleware';
import { body, param, query } from 'express-validator';

const categoryApprovalController = new CategoryApprovalController();

const router = Router();
const categoryController = new CategoryController();

// All routes require authentication
// Note: resolveTenant is already applied in routes/index.ts
router.use(authenticate);

// All category routes require form access
router.use(requireFormAccess('frmDefCategory'));

/**
 * Validation rules
 */
const createCategoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('color')
    .optional()
    .trim()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color code (e.g., #FF5733)'),
  body('icon').optional().trim(),
  body('parent')
    .optional()
    .isMongoId()
    .withMessage('Parent must be a valid category ID'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a positive integer'),
];

const updateCategoryValidation = [
  param('id').isMongoId().withMessage('Invalid category ID'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('color')
    .optional()
    .trim()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color code (e.g., #FF5733)'),
  body('icon').optional().trim(),
  body('parent')
    .optional()
    .isMongoId()
    .withMessage('Parent must be a valid category ID'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a positive integer'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

const sortOrderValidation = [
  body('updates').isArray({ min: 1 }).withMessage('Updates must be a non-empty array'),
  body('updates.*.id').isMongoId().withMessage('Each update must have a valid category ID'),
  body('updates.*.sortOrder')
    .isInt({ min: 0 })
    .withMessage('Sort order must be a positive integer'),
];

const categoryIdValidation = [param('id').isMongoId().withMessage('Invalid category ID')];

const getCategoriesValidation = [
  query('includeInactive')
    .optional()
    .isIn(['true', 'false', '1', '0'])
    .withMessage('includeInactive must be a boolean value'),
  query('search').optional().trim(),
  query('sortBy')
    .optional()
    .isIn(['name', 'sortOrder', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

/**
 * Routes
 */

// GET /api/categories/stats - Get category statistics (must be before /:id)
router.get('/stats', categoryController.getCategoryStats);

// GET /api/categories/tree - Get categories in tree structure
router.get('/tree', categoryController.getCategoriesTree);

// PUT /api/categories/sort-order - Update sort order (must be before /:id)
router.put(
  '/sort-order',
  sortOrderValidation,
  validate,
  auditMiddleware({ action: 'update', entityType: 'category' }),
  categoryController.updateSortOrder
);

// POST /api/categories - Create category
router.post(
  '/',
  createCategoryValidation,
  validate,
  auditMiddleware({ action: 'create', entityType: 'category' }),
  categoryController.createCategory
);

// GET /api/categories - Get all categories
router.get('/', getCategoriesValidation, validate, categoryController.getCategories);

// GET /api/categories/:id - Get category by ID
router.get('/:id', categoryIdValidation, validate, categoryController.getCategoryById);

// PUT /api/categories/:id - Update category
router.put(
  '/:id',
  updateCategoryValidation,
  validate,
  auditMiddleware({ action: 'update', entityType: 'category' }),
  categoryController.updateCategory
);

// DELETE /api/categories/:id - Delete category
router.delete(
  '/:id',
  categoryIdValidation,
  validate,
  auditMiddleware({ action: 'delete', entityType: 'category' }),
  categoryController.deleteCategory
);

// POST /api/categories/:id/archive - Archive category
router.post(
  '/:id/archive',
  categoryIdValidation,
  validate,
  auditMiddleware({ action: 'update', entityType: 'category' }),
  categoryController.archiveCategory
);

// POST /api/categories/:id/unarchive - Unarchive category
router.post(
  '/:id/unarchive',
  categoryIdValidation,
  validate,
  auditMiddleware({ action: 'update', entityType: 'category' }),
  categoryController.unarchiveCategory
);

// GET /api/categories/templates - Get category templates
router.get('/templates', categoryController.getTemplates);

// POST /api/categories/from-template - Create categories from template
router.post('/from-template', categoryController.createFromTemplate);

// POST /api/categories/save-template - Save category as template
router.post('/save-template', categoryController.saveAsTemplate);

// POST /api/categories/:id/approvals - Create approval request for category
router.post(
  '/:id/approvals',
  categoryIdValidation,
  validate,
  (req: Request, res: Response, next: NextFunction) => auditMiddleware({ action: 'update', entityType: 'category' })(req as any, res, next),
  categoryApprovalController.createApprovalRequest
);

// GET /api/categories/:id/approvals - Get approval requests for category
router.get(
  '/:id/approvals',
  categoryIdValidation,
  validate,
  categoryApprovalController.getApprovalRequestsForCategory
);

// GET /api/categories/approvals/my-requests - Get approval requests created by current user
router.get(
  '/approvals/my-requests',
  validate,
  categoryApprovalController.getApprovalRequestsForUser
);

// POST /api/categories/approvals/:id/approve - Submit approval decision
router.post(
  '/approvals/:id/approve',
  param('id').isMongoId().withMessage('Invalid approval ID'),
  validate,
  (req: Request, res: Response, next: NextFunction) => auditMiddleware({ action: 'update', entityType: 'category' })(req as any, res, next),
  categoryApprovalController.submitApprovalDecision
);

// DELETE /api/categories/approvals/:id - Cancel approval request
router.delete(
  '/approvals/:id',
  param('id').isMongoId().withMessage('Invalid approval ID'),
  validate,
  (req: Request, res: Response, next: NextFunction) => auditMiddleware({ action: 'update', entityType: 'category' })(req as any, res, next),
  categoryApprovalController.cancelApprovalRequest
);

// GET /api/categories/approvals/pending - Get pending approvals for current user
router.get(
  '/approvals/pending',
  categoryApprovalController.getPendingApprovalRequests
);

export default router;
