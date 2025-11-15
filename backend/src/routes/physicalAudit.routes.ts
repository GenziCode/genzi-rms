import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireFormAccess } from '../middleware/formPermission.middleware';
import {
  PhysicalAuditController,
  physicalAuditValidations,
} from '../controllers/physicalAudit.controller';

const router = Router();
const controller = new PhysicalAuditController();

router.use(authenticate);
router.use(requireFormAccess('frmShopInventory'));

router.get('/', physicalAuditValidations.list, controller.listSessions);
router.get('/:id', physicalAuditValidations.getOne, controller.getSession);
router.post('/', physicalAuditValidations.create, controller.createSession);
router.put('/:id', physicalAuditValidations.update, controller.updateSession);
router.post('/:id/start', physicalAuditValidations.start, controller.startCounting);
router.post('/:id/counts', physicalAuditValidations.record, controller.recordCounts);
router.post('/:id/review', physicalAuditValidations.review, controller.moveToReview);
router.post('/:id/complete', physicalAuditValidations.complete, controller.completeSession);
router.post('/:id/cancel', physicalAuditValidations.cancel, controller.cancelSession);

export default router;

