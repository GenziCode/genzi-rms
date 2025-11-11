import { Router } from 'express';
import { PurchaseOrderController } from '../controllers/purchaseOrder.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { validate } from '../middleware/validation.middleware';
import { body, param, query } from 'express-validator';

const router = Router();
const poController = new PurchaseOrderController();

router.use(authenticate);
router.use(resolveTenant);

const createPOValidation = [
  body('vendorId').notEmpty().isMongoId().withMessage('Invalid vendor ID'),
  body('storeId').notEmpty().isMongoId().withMessage('Invalid store ID'),
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  body('items.*.productId').notEmpty().isMongoId(),
  body('items.*.quantity').notEmpty().isInt({ min: 1 }),
  body('items.*.unitCost').notEmpty().isFloat({ min: 0 }),
  body('expectedDate').optional().isISO8601(),
  body('shippingCost').optional().isFloat({ min: 0 }),
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
router.get('/:id', [param('id').isMongoId()], validate, poController.getPOById);
router.post('/:id/send', [param('id').isMongoId()], validate, poController.sendPO);
router.post('/:id/receive', receiveGoodsValidation, validate, poController.receiveGoods);
router.post('/:id/cancel', cancelPOValidation, validate, poController.cancelPO);

export default router;

