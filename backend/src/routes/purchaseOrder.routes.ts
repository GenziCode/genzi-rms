import { Router } from 'express';
import { PurchaseOrderController } from '../controllers/purchaseOrder.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { validate } from '../middleware/validation.middleware';
import { body, param, query } from 'express-validator';
import { requireFormAccess } from '../middleware/formPermission.middleware';

const router = Router();
const poController = new PurchaseOrderController();

// resolveTenant is already applied in routes/index.ts
router.use(authenticate);

// All purchase order routes require form access
router.use(requireFormAccess('frmPurchaseOrder'));

const createPOValidation = [
  body('vendorId').notEmpty().isMongoId().withMessage('Invalid vendor ID'),
  body('storeId').notEmpty().isMongoId().withMessage('Invalid store ID'),
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  body('items.*.productId').notEmpty().isMongoId().withMessage('Invalid product ID'),
  body('items.*.quantity').notEmpty().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
  body('items.*.unitCost').optional().isFloat({ min: 0 }).withMessage('Unit cost must be a positive number'),
  body('items.*.unitPrice').custom((value, { req, path }) => {
    const index = parseInt(path.split('.')[1]);
    const item = req.body.items[index];
    // At least one of unitPrice or unitCost must be provided
    if (!value && !item?.unitCost) {
      throw new Error('Either unitPrice or unitCost is required');
    }
    return true;
  }),
  body('items.*.discount').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount must be between 0 and 100'),
  body('items.*.tax').optional().isFloat({ min: 0, max: 100 }).withMessage('Tax must be between 0 and 100'),
  body('expectedDeliveryDate').optional().isISO8601().withMessage('Invalid expected delivery date'),
  body('expectedDate').optional().isISO8601().withMessage('Invalid expected date'),
  body('shippingCost').optional().isFloat({ min: 0 }).withMessage('Shipping cost must be a positive number'),
  body('paymentTerms').optional().isString().trim().isLength({ max: 100 }).withMessage('Payment terms must be less than 100 characters'),
  body('notes').optional().isString().trim().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters'),
];

const receiveGoodsValidation = [
  param('id').isMongoId(),
  body('items').isArray({ min: 1 }),
  body('items.*.productId').notEmpty().isMongoId(),
  body('items.*.receivedQuantity').notEmpty().isInt({ min: 1 }),
  body('vendorInvoiceNumber').optional().trim(),
];

const cancelPOValidation = [
  param('id').isMongoId(),
  body('reason').notEmpty().trim().isLength({ min: 5, max: 500 }),
];

router.post('/', createPOValidation, validate, poController.createPO);
router.get('/', poController.getPOs);
router.get('/stats', poController.getStats);
router.get('/:id', [param('id').isMongoId()], validate, poController.getPOById);
router.post('/:id/send', [param('id').isMongoId()], validate, poController.sendPO);
router.post('/:id/receive', receiveGoodsValidation, validate, poController.receiveGoods);
router.post('/:id/cancel', cancelPOValidation, validate, poController.cancelPO);

export default router;

