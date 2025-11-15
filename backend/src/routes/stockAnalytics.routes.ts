import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireFormAccess } from '../middleware/formPermission.middleware';
import {
  StockAnalyticsController,
  stockAnalyticsValidations,
} from '../controllers/stockAnalytics.controller';

const router = Router();
const controller = new StockAnalyticsController();

router.use(authenticate);
router.use(requireFormAccess('frmShopInventory'));

router.get('/aging', stockAnalyticsValidations.aging, controller.getAging);
router.get('/turnover', stockAnalyticsValidations.turnover, controller.getTurnover);
router.get('/congestion', stockAnalyticsValidations.congestion, controller.getCongestion);

export default router;

