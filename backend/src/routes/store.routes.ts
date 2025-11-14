import { Router } from 'express';
import { body, param } from 'express-validator';
import { storeController } from '../controllers/store.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { auditMiddleware } from '../middleware/audit.middleware';
import { requireFormAccess } from '../middleware/formPermission.middleware';

const router = Router();

router.use(authenticate);

// All store routes require form access
router.use(requireFormAccess('frmDefShops'));

router.get('/', storeController.list);
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid store ID')],
  validate,
  storeController.getById
);

const storeValidation = [
  body('name').trim().notEmpty().withMessage('Store name is required'),
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Store code is required')
    .isLength({ max: 10 })
    .withMessage('Store code must be at most 10 characters'),
  body('email').optional().isEmail().withMessage('Invalid email address').trim(),
  body('phone').optional().trim().isLength({ max: 30 }),
  body('settings.timezone').optional().isString(),
  body('settings.currency').optional().isString(),
  body('settings.taxRate').optional().isFloat({ min: 0 }),
];

router.post(
  '/',
  storeValidation,
  validate,
  auditMiddleware({ action: 'create', entityType: 'store' }),
  storeController.create
);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid store ID'),
    ...storeValidation.map((rule) => rule.optional()),
  ],
  validate,
  auditMiddleware({
    action: 'update',
    entityType: 'store',
    resolveEntityId: ({ req }) => req.params.id,
  }),
  storeController.update
);

router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid store ID')],
  validate,
  auditMiddleware({
    action: 'delete',
    entityType: 'store',
    resolveEntityId: ({ req }) => req.params.id,
  }),
  storeController.delete
);

export default router;


