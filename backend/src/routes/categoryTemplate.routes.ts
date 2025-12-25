import { Router, Request, Response, NextFunction } from 'express';
import { CategoryTemplateController } from '../controllers/categoryTemplate.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { validate } from '../middleware/validation.middleware';
import { auditMiddleware } from '../middleware/audit.middleware';
import { requireFormAccess } from '../middleware/formPermission.middleware';
import { body, param } from 'express-validator';

const router = Router();
const categoryTemplateController = new CategoryTemplateController();

// All routes require authentication and tenant resolution
router.use((req: Request, res: Response, next: NextFunction) => authenticate(req as any, res, next));
router.use((req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next));
router.use((req: Request, res: Response, next: NextFunction) => requireFormAccess('frmDefCategory')(req as any, res, next));

/**
 * Validation rules
 */
const createTemplateValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Template name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Template name must be between 2 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('categoryStructure').isArray().withMessage('Category structure must be an array'),
  body('categoryStructure.*.name')
    .trim()
    .notEmpty()
    .withMessage('Each category must have a name'),
  body('categoryStructure.*.description').optional().trim(),
  body('categoryStructure.*.color').optional().trim().matches(/^#[0-9A-F]{6}$/i),
  body('categoryStructure.*.icon').optional().trim(),
  body('categoryStructure.*.sortOrder').optional().isInt({ min: 0 }),
  body('categoryStructure.*.children').optional().isArray(),
  body('isPublic').optional().isBoolean(),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('tags.*').optional().trim(),
];

const updateTemplateValidation = [
  param('id').isMongoId().withMessage('Invalid template ID'),
  ...createTemplateValidation.slice(1), // Reuse most of the create validations
];

const templateIdValidation = [
  param('id').isMongoId().withMessage('Invalid template ID'),
];

const applyTemplateValidation = [
  param('id').isMongoId().withMessage('Invalid template ID'),
  body('prefix').optional().trim(),
  body('parentCategoryId').optional().isMongoId(),
];

const saveCategoryAsTemplateValidation = [
  param('id').isMongoId().withMessage('Invalid category ID'),
  body('templateName')
    .trim()
    .notEmpty()
    .withMessage('Template name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Template name must be between 2 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('tags').optional().isArray(),
  body('tags.*').optional().trim(),
];

/**
 * Routes
 */

// GET /api/categories/templates - Get all templates
router.get('/', categoryTemplateController.getTemplates);

// POST /api/categories/templates - Create template
router.post(
  '/',
  createTemplateValidation,
  validate,
  (req: Request, res: Response, next: NextFunction) => auditMiddleware({ action: 'create', entityType: 'categoryTemplate' })(req as any, res, next),
  categoryTemplateController.createTemplate
);

// GET /api/categories/templates/:id - Get template by ID
router.get('/:id', templateIdValidation, validate, categoryTemplateController.getTemplateById);

// PUT /api/categories/templates/:id - Update template
router.put(
  '/:id',
  updateTemplateValidation,
  validate,
  (req: Request, res: Response, next: NextFunction) => auditMiddleware({ action: 'update', entityType: 'categoryTemplate' })(req as any, res, next),
  categoryTemplateController.updateTemplate
);

// DELETE /api/categories/templates/:id - Delete template
router.delete(
  '/:id',
  templateIdValidation,
  validate,
  (req: Request, res: Response, next: NextFunction) => auditMiddleware({ action: 'delete', entityType: 'categoryTemplate' })(req as any, res, next),
  categoryTemplateController.deleteTemplate
);

// POST /api/categories/templates/:id/apply - Apply template
router.post(
  '/:id/apply',
  templateIdValidation,
  applyTemplateValidation,
  validate,
  (req: Request, res: Response, next: NextFunction) => auditMiddleware({ action: 'create', entityType: 'category' })(req as any, res, next),
  categoryTemplateController.applyTemplate
);

// POST /api/categories/:id/save-template - Save category as template
router.post(
  '/:id/save-template',
  param('id').isMongoId().withMessage('Invalid category ID'),
  saveCategoryAsTemplateValidation,
  validate,
  (req: Request, res: Response, next: NextFunction) => auditMiddleware({ action: 'create', entityType: 'categoryTemplate' })(req as any, res, next),
  categoryTemplateController.saveCategoryAsTemplate
);

export default router;