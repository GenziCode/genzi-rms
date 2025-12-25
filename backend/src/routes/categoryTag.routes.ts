import { Router, Request, Response, NextFunction } from 'express';
import { CategoryTagController } from '../controllers/categoryTag.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { auditMiddleware } from '../middleware/audit.middleware';
import { requireFormAccess } from '../middleware/formPermission.middleware';
import { body, param, query } from 'express-validator';

const router = Router();
const categoryTagController = new CategoryTagController();

// All routes require authentication
// Note: resolveTenant is already applied in routes/index.ts
router.use((req: Request, res: Response, next: NextFunction) => authenticate(req as any, res, next));
router.use((req: Request, res: Response, next: NextFunction) => requireFormAccess('frmDefCategory')(req as any, res, next));

/**
 * Validation rules
 */
const createTagValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Tag name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Tag name must be between 2 and 50 characters'),
  body('description').optional().trim().isLength({ max: 200 }),
  body('color')
    .trim()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color code (e.g., #FF5733)'),
  body('icon').optional().trim(),
];

const updateTagValidation = [
  param('id').isMongoId().withMessage('Invalid tag ID'),
  ...createTagValidation.slice(1), // Reuse most of create validation but exclude name requirement
];

const tagIdValidation = [
  param('id').isMongoId().withMessage('Invalid tag ID'),
];

const assignTagsValidation = [
  param('categoryId').isMongoId().withMessage('Invalid category ID'),
  body('tagIds').isArray().withMessage('tagIds must be an array'),
  body('tagIds.*').isMongoId().withMessage('Each tag ID must be a valid MongoDB ID'),
];

const getTagsValidation = [
  query('includeInactive').optional().isIn(['true', 'false']),
  query('search').optional().trim(),
  query('sortBy').optional().isIn(['name', 'createdAt', 'updatedAt']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

/**
 * Routes
 */

// GET /api/category-tags - Get all tags
router.get('/', getTagsValidation, validate, categoryTagController.getTags);

// POST /api/category-tags - Create tag
router.post(
  '/',
  createTagValidation,
  validate,
  (req: Request, res: Response, next: NextFunction) => auditMiddleware({ action: 'create', entityType: 'categoryTag' })(req as any, res, next),
  categoryTagController.createTag
);

// GET /api/category-tags/:id - Get tag by ID
router.get('/:id', tagIdValidation, validate, categoryTagController.getTagById);

// PUT /api/category-tags/:id - Update tag
router.put(
  '/:id',
  updateTagValidation,
  validate,
  (req: Request, res: Response, next: NextFunction) => auditMiddleware({ action: 'update', entityType: 'categoryTag' })(req as any, res, next),
  categoryTagController.updateTag
);

// DELETE /api/category-tags/:id - Delete tag
router.delete(
  '/:id',
  tagIdValidation,
  validate,
  (req: Request, res: Response, next: NextFunction) => auditMiddleware({ action: 'delete', entityType: 'categoryTag' })(req as any, res, next),
  categoryTagController.deleteTag
);

// POST /api/categories/:categoryId/tags - Assign tags to category
router.post(
  '/categories/:categoryId/tags',
  param('categoryId').isMongoId().withMessage('Invalid category ID'),
  assignTagsValidation,
  validate,
  (req: Request, res: Response, next: NextFunction) => auditMiddleware({ action: 'update', entityType: 'category' })(req as any, res, next),
  categoryTagController.assignTagsToCategory
);

// DELETE /api/categories/:categoryId/tags - Remove tags from category
router.delete(
  '/categories/:categoryId/tags',
  param('categoryId').isMongoId().withMessage('Invalid category ID'),
  assignTagsValidation,
  validate,
  (req: Request, res: Response, next: NextFunction) => auditMiddleware({ action: 'update', entityType: 'category' })(req as any, res, next),
  categoryTagController.removeTagsFromCategory
);

// GET /api/categories/:categoryId/tags - Get tags for category
router.get('/categories/:categoryId/tags', param('categoryId').isMongoId().withMessage('Invalid category ID'), validate, categoryTagController.getCategoryTags);

export default router;