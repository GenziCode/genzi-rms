import { Router, Request, Response, NextFunction } from 'express';
import { CategoryAutomationRuleController } from '../controllers/categoryAutomationRule.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { auditMiddleware } from '../middleware/audit.middleware';
import { requireFormAccess } from '../middleware/formPermission.middleware';
import { body, param, query } from 'express-validator';

const router = Router();
const categoryAutomationRuleController = new CategoryAutomationRuleController();

// All routes require authentication
// Note: resolveTenant is already applied in routes/index.ts
router.use((req: Request, res: Response, next: NextFunction) => authenticate(req as any, res, next));
router.use((req: Request, res: Response, next: NextFunction) => requireFormAccess('frmDefCategory')(req as any, res, next));

/**
 * Validation rules
 */
const createRuleValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Rule name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Rule name must be between 2 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('triggerEvent')
    .isIn(['create', 'update', 'delete', 'activate', 'deactivate', 'archive', 'unarchive'])
    .withMessage('Invalid trigger event'),
  body('conditions').isArray().withMessage('Conditions must be an array'),
  body('conditions.*.field').trim().notEmpty().withMessage('Condition field is required'),
  body('conditions.*.operator')
    .isIn(['equals', 'notEquals', 'contains', 'greaterThan', 'lessThan', 'in'])
    .withMessage('Invalid condition operator'),
  body('actions').isArray().withMessage('Actions must be an array'),
  body('actions.*.type')
    .isIn(['sendNotification', 'updateField', 'createTask', 'triggerAPI', 'updateCategory'])
    .withMessage('Invalid action type'),
  body('isActive').optional().isBoolean(),
  body('priority').optional().isInt({ min: 0 }),
];

const updateRuleValidation = [
  param('id').isMongoId().withMessage('Invalid rule ID'),
  ...createRuleValidation.slice(1), // Reuse most of create validation rules
];

const ruleIdValidation = [
  param('id').isMongoId().withMessage('Invalid rule ID'),
];

const getRulesValidation = [
  query('includeInactive').optional().isIn(['true', 'false']),
  query('search').optional().trim(),
  query('sortBy').optional().isIn(['name', 'priority', 'createdAt', 'updatedAt']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

const testRuleValidation = [
  body('conditions').isArray().withMessage('Conditions must be an array'),
  body('testData').isObject().withMessage('TestData must be an object'),
];

/**
 * Routes
 */

// GET /api/category-automation-rules - Get all rules
router.get('/', getRulesValidation, validate, categoryAutomationRuleController.getRules);

// POST /api/category-automation-rules - Create rule
router.post(
  '/',
  createRuleValidation,
  validate,
  (req: Request, res: Response, next: NextFunction) => auditMiddleware({ action: 'create', entityType: 'categoryAutomationRule' })(req as any, res, next),
  categoryAutomationRuleController.createRule
);

// GET /api/category-automation-rules/:id - Get rule by ID
router.get('/:id', ruleIdValidation, validate, categoryAutomationRuleController.getRuleById);

// PUT /api/category-automation-rules/:id - Update rule
router.put(
  '/:id',
  updateRuleValidation,
  validate,
  (req: Request, res: Response, next: NextFunction) => auditMiddleware({ action: 'update', entityType: 'categoryAutomationRule' })(req as any, res, next),
  categoryAutomationRuleController.updateRule
);

// DELETE /api/category-automation-rules/:id - Delete rule
router.delete(
  '/:id',
  ruleIdValidation,
  validate,
  (req: Request, res: Response, next: NextFunction) => auditMiddleware({ action: 'delete', entityType: 'categoryAutomationRule' })(req as any, res, next),
  categoryAutomationRuleController.deleteRule
);

// POST /api/category-automation-rules/test - Test rule conditions
router.post('/test', testRuleValidation, validate, categoryAutomationRuleController.testRule);

export default router;