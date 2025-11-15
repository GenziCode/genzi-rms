import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireFormAccess } from '../middleware/formPermission.middleware';
import {
  NotificationController,
  notificationValidations,
} from '../controllers/notification.controller';

const router = Router();
const controller = new NotificationController();

router.use(authenticate);

router.get('/preferences', controller.getPreferences);
router.put('/preferences', notificationValidations.updatePreferences, controller.updatePreferences);
router.get('/inbox', notificationValidations.listInbox, controller.listInbox);
router.patch('/inbox/:id/read', notificationValidations.markInboxRead, controller.markInboxRead);
router.patch('/inbox/read-all', controller.markAllInboxRead);
router.delete('/inbox/:id', notificationValidations.deleteInbox, controller.deleteInboxItem);

router.get('/', notificationValidations.list, controller.listNotifications);

router.use(requireFormAccess('frmSystemConfig'));

router.post('/', notificationValidations.create, controller.createNotification);
router.patch('/:id/status', notificationValidations.updateStatus, controller.updateStatus);
router.get('/routes/list', controller.listRoutes);
router.post('/routes', notificationValidations.upsertRoute, controller.upsertRoute);

export default router;

