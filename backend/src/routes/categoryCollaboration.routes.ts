import { Router } from 'express';
import { CategoryCollaborationController } from '../controllers/categoryCollaboration.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { requireFormAccess } from '../middleware/formPermission.middleware';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validation.middleware';

const router = Router();
const categoryCollaborationController = new CategoryCollaborationController();

// Apply middleware
router.use((req: any, res: any, next: any) => resolveTenant(req, res, next));
router.use((req: any, res: any, next: any) => authenticate(req, res, next));
router.use((req: any, res: any, next: any) => requireFormAccess('frmDefCategory')(req, res, next));

// Validation middleware
const collaborationValidation = [
  body('categoryId')
    .isMongoId()
    .withMessage('Valid category ID is required'),
  body('invitedUserId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  body('role')
    .isIn(['viewer', 'editor', 'admin'])
    .withMessage('Role must be viewer, editor, or admin'),
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array'),
  body('permissions.*')
    .optional()
    .isString()
    .withMessage('Each permission must be a string'),
];

const updatePermissionsValidation = [
  ...collaborationValidation,
  body('role')
    .notEmpty()
    .withMessage('Role is required'),
];

const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID'),
  param('categoryId')
    .isMongoId()
    .withMessage('Invalid category ID'),
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
];

const collaborationIdValidation = [
  param('collaborationId')
    .isMongoId()
    .withMessage('Invalid collaboration ID'),
];

const toggleNotificationsValidation = [
  body('enabled')
    .isBoolean()
    .withMessage('Enabled must be a boolean value'),
];

// GET /api/category-collaborations/pending-invitations - Get pending invitations for current user
router.get(
  '/pending-invitations',
  validate,
  categoryCollaborationController.getUserPendingInvitations
);

// GET /api/category-collaborations/my-categories - Get categories current user collaborates on
router.get(
  '/my-categories',
  validate,
  categoryCollaborationController.getUserCollaboratedCategories
);

// POST /api/category-collaborations/invite - Invite a user to collaborate on a category
router.post(
  '/invite',
  collaborationValidation,
  validate,
  categoryCollaborationController.inviteUser
);

// POST /api/category-collaborations/:collaborationId/accept - Accept a collaboration invitation
router.post(
  '/:collaborationId/accept',
  collaborationIdValidation,
  validate,
  categoryCollaborationController.acceptInvitation
);

// POST /api/category-collaborations/:collaborationId/reject - Reject a collaboration invitation
router.post(
  '/:collaborationId/reject',
  collaborationIdValidation,
  validate,
  categoryCollaborationController.rejectInvitation
);

// DELETE /api/category-collaborations/:categoryId/:userId - Remove a collaborator from a category
router.delete(
  '/:categoryId/:userId',
  [
    ...idValidation,
  ],
  validate,
  categoryCollaborationController.removeCollaborator
);

// PUT /api/category-collaborations/:categoryId/:userId/permissions - Update collaborator permissions
router.put(
  '/:categoryId/:userId/permissions',
  [
    ...idValidation,
    ...updatePermissionsValidation,
  ],
  validate,
  categoryCollaborationController.updateCollaboratorPermissions
);

// GET /api/category-collaborations/:categoryId/collaborators - Get all collaborators for a category
router.get(
  '/:categoryId/collaborators',
  [
    param('categoryId')
      .isMongoId()
      .withMessage('Invalid category ID'),
    query('includeInactive')
      .optional()
      .isBoolean()
      .withMessage('Include inactive must be a boolean'),
  ],
  validate,
  categoryCollaborationController.getCategoryCollaborators
);

// GET /api/category-collaborations/:categoryId/:userId/permission-check - Check if user has specific permission
router.get(
  '/:categoryId/:userId/permission-check',
  [
    ...idValidation,
    query('requiredPermission')
      .optional()
      .isString()
      .withMessage('Required permission must be a string'),
  ],
  validate,
  categoryCollaborationController.checkCollaborationPermission
);

// PUT /api/category-collaborations/:categoryId/notifications - Toggle notifications for a collaboration
router.put(
  '/:categoryId/notifications',
  [
    param('categoryId')
      .isMongoId()
      .withMessage('Invalid category ID'),
    ...toggleNotificationsValidation,
  ],
  validate,
  categoryCollaborationController.toggleNotifications
);

// PUT /api/category-collaborations/:categoryId/accessed - Update last accessed time
router.put(
  '/:categoryId/accessed',
  [
    param('categoryId')
      .isMongoId()
      .withMessage('Invalid category ID'),
  ],
  validate,
  categoryCollaborationController.updateLastAccessed
);

export default router;