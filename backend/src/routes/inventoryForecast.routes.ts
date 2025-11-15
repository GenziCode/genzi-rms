import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireFormAccess } from '../middleware/formPermission.middleware';
import {
  InventoryForecastController,
  listForecastValidations,
  overrideValidations,
} from '../controllers/inventoryForecast.controller';

const router = Router();
const controller = new InventoryForecastController();

router.use(authenticate);
router.use(requireFormAccess('frmShopInventory'));

router.get('/', listForecastValidations, controller.listForecasts);
router.put('/:productId/override', overrideValidations, controller.updateOverride);

export default router;

