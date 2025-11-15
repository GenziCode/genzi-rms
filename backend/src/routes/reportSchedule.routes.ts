import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  reportScheduleController,
  createScheduleValidation,
  updateScheduleValidation,
  listSchedulesValidation,
  scheduleIdValidation,
} from '../controllers/reportSchedule.controller';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  [...listSchedulesValidation, validate],
  reportScheduleController.getSchedules
);

router.post(
  '/',
  [...createScheduleValidation, validate],
  reportScheduleController.createSchedule
);

router.get(
  '/:id',
  [...scheduleIdValidation, validate],
  reportScheduleController.getSchedule
);

router.put(
  '/:id',
  [...scheduleIdValidation, ...updateScheduleValidation, validate],
  reportScheduleController.updateSchedule
);

router.delete(
  '/:id',
  [...scheduleIdValidation, validate],
  reportScheduleController.deleteSchedule
);

router.patch(
  '/:id/status',
  [
    ...scheduleIdValidation,
    body('isActive').isBoolean().withMessage('isActive must be boolean'),
    validate,
  ],
  reportScheduleController.toggleStatus
);

router.post(
  '/:id/run-now',
  [...scheduleIdValidation, validate],
  reportScheduleController.runNow
);

router.get(
  '/:id/executions',
  [...scheduleIdValidation, validate],
  reportScheduleController.getExecutions
);

export default router;


