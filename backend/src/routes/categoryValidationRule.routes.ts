import { Router } from 'express';
import { CategoryValidationRuleController } from '../controllers/categoryValidationRule.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { requireFormAccess } from '../middleware/formPermission.middleware';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validation.middleware';

const router = Router();
const categoryValidationRuleController = new CategoryValidationRuleController();

// Apply middleware
router.use((req: any, res: any, next: any) => resolveTenant(req, res, next));
router.use((req: any, res: any, next: any) => authenticate(req, res, next));
router.use((req: any, res: any, next: any) => requireFormAccess('frmDefCategory')(req, res, next));

// Validation middleware
const validationRuleValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Rule name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Rule name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('field')
    .notEmpty()
    .withMessage('Field is required')
    .isIn(['name', 'description', 'color', 'icon', 'image', 'sortOrder', 'isActive', 'isPublic', 'parent', 'tags', 'customFields'])
    .withMessage('Invalid field value'),
  body('validationType')
    .notEmpty()
    .withMessage('Validation type is required')
    .isIn(['required', 'minLength', 'maxLength', 'pattern', 'unique', 'custom'])
    .withMessage('Invalid validation type'),
  body('validationValue')
    .notEmpty()
    .withMessage('Validation value is required'),
  body('errorMessage')
    .trim()
    .notEmpty()
    .withMessage('Error message is required')
    .isLength({ max: 200 })
    .withMessage('Error message cannot exceed 200 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('priority')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Priority must be a non-negative integer'),
];

const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid validation rule ID'),
];

const fieldValidation = [
  param('field')
    .notEmpty()
    .withMessage('Field is required')
    .isIn(['name', 'description', 'color', 'icon', 'image', 'sortOrder', 'isActive', 'isPublic', 'parent', 'tags', 'customFields'])
    .withMessage('Invalid field value'),
];

// GET /api/category-validation-rules - Get validation rules with pagination and filtering
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['name', 'field', 'validationType', 'createdAt', 'updatedAt']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    query('field').optional().isIn(['name', 'description', 'color', 'icon', 'image', 'sortOrder', 'isActive', 'isPublic', 'parent', 'tags', 'customFields']).withMessage('Invalid field value'),
    query('validationType').optional().isIn(['required', 'minLength', 'maxLength', 'pattern', 'unique', 'custom']).withMessage('Invalid validation type'),
    query('isActive').optional().isIn(['true', 'false', '1', '0']).withMessage('isActive must be a boolean value'),
  ],
  validate,
  categoryValidationRuleController.getValidationRules
);

// POST /api/category-validation-rules - Create validation rule
router.post(
  '/',
  validationRuleValidation,
  validate,
  categoryValidationRuleController.createValidationRule
);

// GET /api/category-validation-rules/:id - Get validation rule by ID
router.get(
  '/:id',
  idValidation,
  validate,
  categoryValidationRuleController.getValidationRuleById
);

// PUT /api/category-validation-rules/:id - Update validation rule
router.put(
  '/:id',
  [
    ...idValidation,
    ...validationRuleValidation,
  ],
  validate,
  categoryValidationRuleController.updateValidationRule
);

// DELETE /api/category-validation-rules/:id - Delete validation rule
router.delete(
  '/:id',
  idValidation,
  validate,
  categoryValidationRuleController.deleteValidationRule
);

// POST /api/category-validation-rules/validate - Validate a category against active rules
router.post(
  '/validate',
  [
    body('category').isObject().withMessage('Category object is required'),
    body('categoryId').optional().isMongoId().withMessage('Invalid category ID'),
  ],
  validate,
  categoryValidationRuleController.validateCategory
);

// GET /api/category-validation-rules/field/:field - Get validation rules for a specific field
router.get(
  '/field/:field',
  fieldValidation,
  validate,
  categoryValidationRuleController.getValidationRulesByField
);

export default router;