import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireFormAccess } from '../middleware/formPermission.middleware';
import {
  WarehouseController,
  warehouseValidations,
} from '../controllers/warehouse.controller';

const router = Router();
const controller = new WarehouseController();

router.use(authenticate);
router.use(requireFormAccess('frmShopInventory'));

router.get('/', warehouseValidations.list, controller.listWarehouses);
router.get('/:id', warehouseValidations.getOne, controller.getWarehouse);
router.post('/', warehouseValidations.create, controller.createWarehouse);
router.put('/:id', warehouseValidations.update, controller.updateWarehouse);
router.delete('/:id', warehouseValidations.delete, controller.deleteWarehouse);

export default router;

