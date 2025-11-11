import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { validate } from '../middleware/validation.middleware';
import { body, param, query } from 'express-validator';

const router = Router();
const categoryController = new CategoryController();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(resolveTenant);

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
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be a positive integer'),
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
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be a positive integer'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

const sortOrderValidation = [
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

const categoryIdValidation = [
  param('id').isMongoId().withMessage('Invalid category ID'),
];

const getCategoriesValidation = [
  query('includeInactive')
    .optional()
    .isBoolean()
    .withMessage('includeInactive must be a boolean'),
  query('search').optional().trim(),
  query('sortBy')
    .optional()
    .isIn(['name', 'sortOrder', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

/**
 * Routes
 */

// GET /api/categories/stats - Get category statistics (must be before /:id)
router.get(
  '/stats',
  categoryController.getCategoryStats
);

// PUT /api/categories/sort-order - Update sort order (must be before /:id)
router.put(
  '/sort-order',
  sortOrderValidation,
  validate,
  categoryController.updateSortOrder
);

// POST /api/categories - Create category
router.post(
  '/',
  createCategoryValidation,
  validate,
  categoryController.createCategory
);

// GET /api/categories - Get all categories
router.get(
  '/',
  getCategoriesValidation,
  validate,
  categoryController.getCategories
);

// GET /api/categories/:id - Get category by ID
router.get(
  '/:id',
  categoryIdValidation,
  validate,
  categoryController.getCategoryById
);

// PUT /api/categories/:id - Update category
router.put(
  '/:id',
  updateCategoryValidation,
  validate,
  categoryController.updateCategory
);

// DELETE /api/categories/:id - Delete category
router.delete(
  '/:id',
  categoryIdValidation,
  validate,
  categoryController.deleteCategory
);

export default router;

