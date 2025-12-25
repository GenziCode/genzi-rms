import { Router, Request, Response, NextFunction } from 'express';
import { CategoryPermissionController } from '../controllers/categoryPermission.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { requireFormAccess } from '../middleware/formPermission.middleware';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validation.middleware';

const router = Router();
const categoryPermissionController = new CategoryPermissionController();

// Apply middleware
// Note: resolveTenant is typically applied in routes/index.ts, but including here for clarity
router.use((req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next));
router.use((req: Request, res: Response, next: NextFunction) => authenticate(req as any, res, next));
router.use((req: Request, res: Response, next: NextFunction) => requireFormAccess('frmDefCategory')(req as any, res, next));

// Validation middleware
const permissionValidation = [
  body('permissions')
    .isArray({ min: 1 })
    .withMessage('Permissions must be a non-empty array'),
  body('permissions.*')
    .isString()
    .withMessage('Each permission must be a string')
    .isIn([
      'read',
      'write',
      'delete',
      'manage',
      'assign',
      'viewHierarchy',
      'createSubcategory'
    ])
    .withMessage('Invalid permission value'),
];

const userIdValidation = [
  param('userId')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ID'),
];

const categoryIdValidation = [
  param('categoryId')
    .isMongoId()
    .withMessage('Category ID must be a valid MongoDB ID'),
];

const permissionParamValidation = [
  param('permission')
    .isString()
    .withMessage('Permission must be a string')
    .isIn([
      'read',
      'write',
      'delete',
      'manage',
      'assign',
      'viewHierarchy',
      'createSubcategory'
    ])
    .withMessage('Invalid permission value'),
];

// GET /api/category-permissions/:userId/:categoryId/:permission/check - Check if user has specific permission for category
router.get(
  '/:userId/:categoryId/:permission/check',
  [
    ...userIdValidation,
    ...categoryIdValidation,
    ...permissionParamValidation
 ],
  validate,
  (req: Request, res: Response, next: NextFunction) => categoryPermissionController.checkPermission(req as any, res).catch(next)
);

// POST /api/category-permissions/:userId/:categoryId/assign - Assign permissions to user for category
router.post(
  '/:userId/:categoryId/assign',
  [
    ...userIdValidation,
    ...categoryIdValidation,
    ...permissionValidation
 ],
  validate,
  (req: Request, res: Response, next: NextFunction) => categoryPermissionController.assignPermission(req as any, res).catch(next)
);

// POST /api/category-permissions/:userId/:categoryId/remove - Remove permissions from user for category
router.post(
  '/:userId/:categoryId/remove',
  [
    ...userIdValidation,
    ...categoryIdValidation,
    ...permissionValidation
 ],
  validate,
  (req: Request, res: Response, next: NextFunction) => categoryPermissionController.removePermission(req as any, res).catch(next)
);

// GET /api/category-permissions/:userId/:categoryId - Get all permissions for user in category
router.get(
  '/:userId/:categoryId',
  [
    ...userIdValidation,
    ...categoryIdValidation
  ],
  validate,
  (req: Request, res: Response, next: NextFunction) => categoryPermissionController.getUserPermissions(req as any, res).catch(next)
);

// GET /api/category-permissions/:categoryId/users - Get all users with permissions for category
router.get(
  '/:categoryId/users',
 [
    ...categoryIdValidation
 ],
 validate,
  (req: Request, res: Response, next: NextFunction) => categoryPermissionController.getUsersWithPermissions(req as any, res).catch(next)
);

// POST /api/category-permissions/:categoryId/bulk-assign - Bulk assign permissions to multiple users
router.post(
  '/:categoryId/bulk-assign',
  [
    ...categoryIdValidation,
    body('userIds')
      .isArray({ min: 1 })
      .withMessage('User IDs must be a non-empty array'),
    body('userIds.*')
      .isMongoId()
      .withMessage('Each user ID must be a valid MongoDB ID'),
    ...permissionValidation
 ],
  validate,
  (req: Request, res: Response, next: NextFunction) => categoryPermissionController.bulkAssignPermissions(req as any, res).catch(next)
);

// GET /api/category-permissions/:userId/:permission/categories - Get all categories user has specific permission for
router.get(
  '/:userId/:permission/categories',
  [
    ...userIdValidation,
    ...permissionParamValidation
  ],
  validate,
  (req: Request, res: Response, next: NextFunction) => categoryPermissionController.getUserCategories(req as any, res).catch(next)
);

export default router;