import { Router } from 'express';
import { CategoryApprovalController } from '../controllers/categoryApproval.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { requireFormAccess } from '../middleware/formPermission.middleware';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validation.middleware';

const router = Router();
const categoryApprovalController = new CategoryApprovalController();

// Apply middleware
router.use((req: any, res: any, next: any) => resolveTenant(req, res, next));
router.use((req: any, res: any, next: any) => authenticate(req, res, next));
router.use((req: any, res: any, next: any) => requireFormAccess('frmDefCategory')(req, res, next));

// Validation middleware
const approvalRequestValidation = [
  body('categoryId')
    .isMongoId()
    .withMessage('Valid category ID is required'),
  body('requestedChanges')
    .isObject()
    .withMessage('Requested changes must be an object'),
  body('approvers')
    .isArray({ min: 1 })
    .withMessage('At least one approver is required'),
  body('approvers.*')
    .isMongoId()
    .withMessage('Each approver must be a valid user ID'),
  body('approvalChain')
    .isArray({ min: 1 })
    .withMessage('Approval chain must contain at least one user'),
  body('approvalChain.*')
    .isMongoId()
    .withMessage('Each user in approval chain must be a valid user ID'),
  body('reason')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Reason must be a string with max 500 characters'),
];

const approvalDecisionValidation = [
  param('approvalId')
    .isMongoId()
    .withMessage('Valid approval ID is required'),
  body('decision')
    .isIn(['approve', 'reject'])
    .withMessage('Decision must be either "approve" or "reject"'),
  body('reason')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Reason must be a string with max 500 characters'),
];

const commentValidation = [
  param('approvalId')
    .isMongoId()
    .withMessage('Valid approval ID is required'),
  body('comment')
    .isString()
    .notEmpty()
    .isLength({ max: 1000 })
    .withMessage('Comment is required and must be less than 1000 characters'),
];

const idValidation = [
  param('approvalId')
    .isMongoId()
    .withMessage('Valid approval ID is required'),
  param('categoryId')
    .isMongoId()
    .withMessage('Valid category ID is required'),
  param('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
];

const queryValidation = [
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'cancelled'])
    .withMessage('Status must be one of: pending, approved, rejected, cancelled'),
  query('type')
    .optional()
    .isIn(['requested', 'toApprove', 'participated'])
    .withMessage('Type must be one of: requested, toApprove, participated'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'status'])
    .withMessage('Sort by must be one of: createdAt, updatedAt, status'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc'),
];

// POST /api/category-approvals/request - Create a new approval request
router.post(
  '/request',
  approvalRequestValidation,
  validate,
  categoryApprovalController.createApprovalRequest
);

// GET /api/category-approvals/category/:categoryId - Get approval requests for a category
router.get(
  '/category/:categoryId',
  [
    ...idValidation,
    ...queryValidation,
  ],
  validate,
  categoryApprovalController.getApprovalRequestsForCategory
);

// GET /api/category-approvals/user - Get approval requests for current user
router.get(
  '/user',
  queryValidation,
  validate,
  categoryApprovalController.getApprovalRequestsForUser
);

// POST /api/category-approvals/:approvalId/decision - Submit an approval decision
router.post(
  '/:approvalId/decision',
  [
    ...idValidation,
    ...approvalDecisionValidation,
  ],
  validate,
  categoryApprovalController.submitApprovalDecision
);

// POST /api/category-approvals/:approvalId/cancel - Cancel an approval request
router.post(
  '/:approvalId/cancel',
  idValidation,
  validate,
  categoryApprovalController.cancelApprovalRequest
);

// POST /api/category-approvals/:approvalId/comment - Add a comment to an approval request
router.post(
  '/:approvalId/comment',
  [
    ...idValidation,
    ...commentValidation,
  ],
  validate,
  categoryApprovalController.addCommentToApproval
);

// GET /api/category-approvals/pending - Get all pending approval requests
router.get(
  '/pending',
  queryValidation,
  validate,
  categoryApprovalController.getPendingApprovalRequests
);

export default router;