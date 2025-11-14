import { Router } from 'express';
import { reportTemplateController } from '../controllers/reportTemplate.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { body, param, query } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Validation rules
 */
const createTemplateValidation = [
  body('name').notEmpty().trim().withMessage('Template name is required'),
  body('category')
    .isIn(['sales', 'inventory', 'financial', 'customer', 'operational', 'custom'])
    .withMessage('Invalid category'),
  body('module').notEmpty().trim().withMessage('Module is required'),
  body('query').isObject().withMessage('Query configuration is required'),
  body('query.collection').notEmpty().withMessage('Collection name is required'),
  body('columns').isArray({ min: 1 }).withMessage('At least one column is required'),
  body('columns.*.field').notEmpty().withMessage('Column field is required'),
  body('columns.*.label').notEmpty().withMessage('Column label is required'),
  body('columns.*.type')
    .isIn(['string', 'number', 'date', 'currency', 'percentage', 'boolean'])
    .withMessage('Invalid column type'),
];

const updateTemplateValidation = [
  body('name').optional().trim(),
  body('category')
    .optional()
    .isIn(['sales', 'inventory', 'financial', 'customer', 'operational', 'custom']),
  body('columns').optional().isArray({ min: 1 }),
];

const templateIdValidation = [param('id').isMongoId().withMessage('Invalid template ID')];

const cloneTemplateValidation = [
  ...templateIdValidation,
  body('name').notEmpty().trim().withMessage('Template name is required'),
];

/**
 * Routes
 */

// GET /api/report-templates - Get all templates
router.get(
  '/',
  [
    query('category')
      .optional()
      .isIn(['sales', 'inventory', 'financial', 'customer', 'operational', 'custom']),
    query('module').optional().trim(),
    query('isActive').optional().isBoolean(),
    query('isSystemTemplate').optional().isBoolean(),
    validate,
  ],
  reportTemplateController.getTemplates
);

// POST /api/report-templates - Create new template
router.post('/', [...createTemplateValidation, validate], reportTemplateController.createTemplate);

// GET /api/report-templates/:id - Get template by ID
router.get(
  '/:id',
  [...templateIdValidation, validate],
  reportTemplateController.getTemplateById
);

// PUT /api/report-templates/:id - Update template
router.put(
  '/:id',
  [...templateIdValidation, ...updateTemplateValidation, validate],
  reportTemplateController.updateTemplate
);

// DELETE /api/report-templates/:id - Delete template
router.delete(
  '/:id',
  [...templateIdValidation, validate],
  reportTemplateController.deleteTemplate
);

// POST /api/report-templates/:id/clone - Clone template
router.post(
  '/:id/clone',
  [...cloneTemplateValidation, validate],
  reportTemplateController.cloneTemplate
);

// GET /api/report-templates/:id/versions - Get template versions
router.get(
  '/:id/versions',
  [...templateIdValidation, validate],
  reportTemplateController.getTemplateVersions
);

// GET /api/report-templates/:id/versions/:version - Get specific version
router.get(
  '/:id/versions/:version',
  [
    ...templateIdValidation,
    param('version').isInt({ min: 1 }).withMessage('Version must be a positive integer'),
    validate,
  ],
  reportTemplateController.getTemplateVersion
);

// POST /api/report-templates/:id/rollback - Rollback to version
router.post(
  '/:id/rollback',
  [
    ...templateIdValidation,
    body('version').isInt({ min: 1 }).withMessage('Version must be a positive integer'),
    validate,
  ],
  reportTemplateController.rollbackTemplate
);

// GET /api/report-templates/:id/compare/:version1/:version2 - Compare versions
router.get(
  '/:id/compare/:version1/:version2',
  [
    ...templateIdValidation,
    param('version1').isInt({ min: 1 }).withMessage('Version1 must be a positive integer'),
    param('version2').isInt({ min: 1 }).withMessage('Version2 must be a positive integer'),
    validate,
  ],
  reportTemplateController.compareVersions
);

export default router;

