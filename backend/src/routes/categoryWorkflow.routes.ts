import { Router, Request, Response, NextFunction } from 'express';
import { CategoryWorkflowController } from '../controllers/categoryWorkflow.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { auditMiddleware } from '../middleware/audit.middleware';
import { requireFormAccess } from '../middleware/formPermission.middleware';
import { body, param, query } from 'express-validator';

const router = Router();
const categoryWorkflowController = new CategoryWorkflowController();

// All routes require authentication
// Note: resolveTenant is already applied in routes/index.ts
router.use((req: Request, res: Response, next: NextFunction) => authenticate(req as any, res, next));
router.use((req: Request, res: Response, next: NextFunction) => requireFormAccess('frmDefCategory')(req as any, res, next));

/**
 * Validation rules
 */
const createWorkflowValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Workflow name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Workflow name must be between 2 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('triggerEvents').isArray().withMessage('triggerEvents must be an array of valid event names'),
  body('triggerEvents.*').isIn(['create', 'update', 'delete', 'activate', 'deactivate', 'archive', 'unarchive']),
  body('conditions').isArray().withMessage('conditions must be an array'),
  body('actions').isArray().withMessage('actions must be an array'),
  body('isPublic').optional().isBoolean(),
  body('tags').optional().isArray().withMessage('tags must be an array of strings'),
];

const updateWorkflowValidation = [
  param('id').isMongoId().withMessage('Invalid workflow ID'),
  ...createWorkflowValidation.slice(1), // Reuse most of create validation rules
];

const workflowIdValidation = [
  param('id').isMongoId().withMessage('Invalid workflow ID'),
];

const getWorkflowsValidation = [
  query('includeInactive').optional().isIn(['true', 'false']),
  query('search').optional().trim(),
  query('sortBy').optional().isIn(['name', 'createdAt', 'updatedAt', 'usageCount']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

/**
 * Routes
 */

// GET /api/category-workflows - Get all workflows
router.get('/', getWorkflowsValidation, validate, categoryWorkflowController.getWorkflows);

// POST /api/category-workflows - Create workflow
router.post(
  '/',
  createWorkflowValidation,
  validate,
  (req: Request, res: Response, next: NextFunction) => auditMiddleware({ action: 'create', entityType: 'categoryWorkflow' })(req as any, res, next),
  categoryWorkflowController.createWorkflow
);

// GET /api/category-workflows/:id - Get workflow by ID
router.get('/:id', workflowIdValidation, validate, categoryWorkflowController.getWorkflowById);

// PUT /api/category-workflows/:id - Update workflow
router.put(
  '/:id',
  updateWorkflowValidation,
  validate,
  (req: Request, res: Response, next: NextFunction) => auditMiddleware({ action: 'update', entityType: 'categoryWorkflow' })(req as any, res, next),
  categoryWorkflowController.updateWorkflow
);

// DELETE /api/category-workflows/:id - Delete workflow
router.delete(
  '/:id',
  workflowIdValidation,
  validate,
  (req: Request, res: Response, next: NextFunction) => auditMiddleware({ action: 'delete', entityType: 'categoryWorkflow' })(req as any, res, next),
  categoryWorkflowController.deleteWorkflow
);

// POST /api/category-workflows/test - Test workflow conditions
router.post('/test', categoryWorkflowController.testWorkflow);

export default router;