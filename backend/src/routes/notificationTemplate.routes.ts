import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireFormAccess } from '../middleware/formPermission.middleware';
import {
  NotificationTemplateController,
  notificationTemplateValidations,
} from '../controllers/notificationTemplate.controller';

const router = Router();
const controller = new NotificationTemplateController();

router.use(authenticate);
router.use(requireFormAccess('frmSystemConfig'));

router.get('/', notificationTemplateValidations.list, controller.listTemplates);
router.post('/', notificationTemplateValidations.create, controller.createTemplate);
router.post('/preview', notificationTemplateValidations.preview, controller.previewTemplate);
router.get('/:id', notificationTemplateValidations.templateId, controller.getTemplate);
router.put('/:id', notificationTemplateValidations.update, controller.updateTemplate);
router.post(
  '/:id/version',
  notificationTemplateValidations.createVersion,
  controller.createVersion
);
router.delete('/:id', notificationTemplateValidations.templateId, controller.deleteTemplate);

export default router;

