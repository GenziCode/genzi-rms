import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { validate } from '../middleware/validation.middleware';
import { query } from 'express-validator';
import { financialReportsController } from '../controllers/financialReports.controller';

const router = Router();

router.use(authenticate);
router.use(resolveTenant);

router.get(
  '/profit-loss',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('storeId').optional().isMongoId().withMessage('Invalid storeId'),
    validate,
  ],
  financialReportsController.getProfitLoss
);

router.get(
  '/cash-flow',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    validate,
  ],
  financialReportsController.getCashFlow
);

router.get(
  '/accounts-receivable',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    validate,
  ],
  financialReportsController.getAccountsReceivable
);

export default router;


