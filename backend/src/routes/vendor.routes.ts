import { Router } from 'express';
import { VendorController } from '../controllers/vendor.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { validate } from '../middleware/validation.middleware';
import { body, param, query } from 'express-validator';
import { auditMiddleware } from '../middleware/audit.middleware';

const router = Router();
const vendorController = new VendorController();

// resolveTenant is already applied in routes/index.ts
router.use(authenticate);

const createVendorValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 200 }),
  body('company').trim().notEmpty().withMessage('Company is required').isLength({ min: 2, max: 200 }),
  body('email').optional().trim().isEmail().withMessage('Invalid email'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('address').optional().trim().isLength({ max: 500 }),
  body('paymentTerms').optional().trim(),
  body('creditLimit').optional().isFloat({ min: 0 }),
  body('creditDays').optional().isInt({ min: 0 }),
];

const updateVendorValidation = [
  param('id').isMongoId(),
  ...createVendorValidation.map(v => v.optional()),
];

router.get('/:id/stats', [param('id').isMongoId()], validate, vendorController.getVendorStats);
router.post(
  '/',
  createVendorValidation,
  validate,
  auditMiddleware({ action: 'create', entityType: 'vendor' }),
  vendorController.createVendor
);
router.get('/', vendorController.getVendors);
router.get('/:id', [param('id').isMongoId()], validate, vendorController.getVendorById);
router.put(
  '/:id',
  updateVendorValidation,
  validate,
  auditMiddleware({
    action: 'update',
    entityType: 'vendor',
    resolveEntityId: ({ req }) => req.params.id,
  }),
  vendorController.updateVendor
);
router.delete(
  '/:id',
  [param('id').isMongoId()],
  validate,
  auditMiddleware({
    action: 'delete',
    entityType: 'vendor',
    resolveEntityId: ({ req }) => req.params.id,
  }),
  vendorController.deleteVendor
);

export default router;

