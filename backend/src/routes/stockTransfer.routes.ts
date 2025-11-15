import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireFormAccess } from '../middleware/formPermission.middleware';
import { StockTransferController, stockTransferValidations } from '../controllers/stockTransfer.controller';

const router = Router();
const controller = new StockTransferController();

router.use(authenticate);
router.use(requireFormAccess('frmShopInventory'));

router.get('/', stockTransferValidations.list, controller.listTransfers);
router.get('/:id', stockTransferValidations.getOne, controller.getTransfer);
router.post('/', stockTransferValidations.create, controller.createTransfer);
router.put('/:id', stockTransferValidations.update, controller.updateTransfer);

router.post('/:id/submit', stockTransferValidations.submit, controller.submitTransfer);
router.post('/:id/approve', stockTransferValidations.approve, controller.approveTransfer);
router.post('/:id/reject', stockTransferValidations.reject, controller.rejectTransfer);
router.post('/:id/start-picking', stockTransferValidations.picking, controller.startPicking);
router.post('/:id/in-transit', stockTransferValidations.inTransit, controller.markInTransit);
router.post('/:id/received', stockTransferValidations.received, controller.markReceived);
router.post('/:id/cancel', stockTransferValidations.cancel, controller.cancelTransfer);

export default router;

