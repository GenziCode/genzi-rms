import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';

const router = Router();
const settingsController = new SettingsController();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(resolveTenant);

/**
 * Routes
 */

// GET /api/settings - Get all settings
router.get('/', settingsController.getSettings);

// PUT /api/settings/store - Update store settings
router.put('/store', settingsController.updateStoreSettings);

// PUT /api/settings/business - Update business settings
router.put('/business', settingsController.updateBusinessSettings);

// PUT /api/settings/tax - Update tax settings
router.put('/tax', settingsController.updateTaxSettings);

// PUT /api/settings/receipt - Update receipt settings
router.put('/receipt', settingsController.updateReceiptSettings);

// PUT /api/settings/pos - Update POS settings
router.put('/pos', settingsController.updatePOSSettings);

export default router;
