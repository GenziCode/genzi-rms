import { Router } from 'express';
import { body } from 'express-validator';
import { SettingsController } from '../controllers/settings.controller';
import { authenticate } from '../middleware/auth.middleware';
import { auditMiddleware } from '../middleware/audit.middleware';
import { validate } from '../middleware/validation.middleware';
import { requireFormAccess } from '../middleware/formPermission.middleware';

const router = Router();
const settingsController = new SettingsController();

// All routes require authentication
// Note: resolveTenant is already applied in routes/index.ts
router.use(authenticate);

// All settings routes require form access
router.use(requireFormAccess('frmSystemConfig'));

/**
 * Routes
 */

// GET /api/settings - Get all settings
router.get('/', settingsController.getSettings);

// PUT /api/settings/store - Update store settings
router.put(
  '/store',
  auditMiddleware({
    action: 'update',
    entityType: 'settings',
    metadataBuilder: () => ({ section: 'store' }),
  }),
  settingsController.updateStoreSettings
);

// GET /api/settings/business - Get business settings
router.get(
  '/business',
  auditMiddleware({
    action: 'read',
    entityType: 'settings',
    metadataBuilder: () => ({ section: 'business' }),
  }),
  settingsController.getBusinessSettings
);

// PUT /api/settings/business - Update business settings
router.put(
  '/business',
  auditMiddleware({
    action: 'update',
    entityType: 'settings',
    metadataBuilder: () => ({ section: 'business' }),
  }),
  settingsController.updateBusinessSettings
);

// GET /api/settings/tax - Get tax settings
router.get(
  '/tax',
  auditMiddleware({
    action: 'read',
    entityType: 'settings',
    metadataBuilder: () => ({ section: 'tax' }),
  }),
  settingsController.getTaxSettings
);

// PUT /api/settings/tax - Update tax settings
router.put(
  '/tax',
  auditMiddleware({
    action: 'update',
    entityType: 'settings',
    metadataBuilder: () => ({ section: 'tax' }),
  }),
  settingsController.updateTaxSettings
);

// GET /api/settings/receipt - Get receipt settings
router.get(
  '/receipt',
  auditMiddleware({
    action: 'read',
    entityType: 'settings',
    metadataBuilder: () => ({ section: 'receipt' }),
  }),
  settingsController.getReceiptSettings
);

// PUT /api/settings/receipt - Update receipt settings
router.put(
  '/receipt',
  auditMiddleware({
    action: 'update',
    entityType: 'settings',
    metadataBuilder: () => ({ section: 'receipt' }),
  }),
  settingsController.updateReceiptSettings
);

// GET /api/settings/pos - Get POS settings
router.get(
  '/pos',
  auditMiddleware({
    action: 'read',
    entityType: 'settings',
    metadataBuilder: () => ({ section: 'pos' }),
  }),
  settingsController.getPOSSettings
);

// PUT /api/settings/pos - Update POS settings
router.put(
  '/pos',
  auditMiddleware({
    action: 'update',
    entityType: 'settings',
    metadataBuilder: () => ({ section: 'pos' }),
  }),
  settingsController.updatePOSSettings
);

// Communication settings (email & SMS)
router.get('/communications', settingsController.getCommunicationSettings);
router.put(
  '/communications',
  auditMiddleware({
    action: 'update',
    entityType: 'settings',
    metadataBuilder: () => ({ section: 'communications' }),
  }),
  settingsController.updateCommunicationSettings
);

// GET /api/settings/payments
router.get(
  '/payments',
  auditMiddleware({
    action: 'read',
    entityType: 'settings',
    metadataBuilder: () => ({ section: 'payments' }),
  }),
  settingsController.getPaymentSettings
);

router.put(
  '/payments',
  [
    body('allowCash').optional().isBoolean(),
    body('allowCard').optional().isBoolean(),
    body('allowBankTransfer').optional().isBoolean(),
    body('allowStoreCredit').optional().isBoolean(),
    body('requireSignature').optional().isBoolean(),
    body('autoCapture').optional().isBoolean(),
    body('stripe.enabled').optional().isBoolean(),
    body('stripe.publishableKey')
      .optional({ nullable: true })
      .isString()
      .withMessage('Publishable key must be a string'),
    body('stripe.secretKey')
      .optional({ nullable: true })
      .isString()
      .withMessage('Secret key must be a string'),
    body('stripe.webhookSecret')
      .optional({ nullable: true })
      .isString()
      .withMessage('Webhook secret must be a string'),
    validate,
  ],
  auditMiddleware({
    action: 'update',
    entityType: 'settings',
    metadataBuilder: () => ({ section: 'payments' }),
  }),
  settingsController.updatePaymentSettings
);

// GET /api/settings/integrations
router.get(
  '/integrations',
  auditMiddleware({
    action: 'read',
    entityType: 'settings',
    metadataBuilder: () => ({ section: 'integrations' }),
  }),
  settingsController.getIntegrationSettings
);

router.put(
  '/integrations',
  [
    body('ecommerce.shopify.enabled').optional().isBoolean(),
    body('ecommerce.shopify.storeDomain')
      .optional({ nullable: true })
      .isString()
      .withMessage('Shopify store domain must be a string'),
    body('ecommerce.shopify.accessToken')
      .optional({ nullable: true })
      .isString()
      .withMessage('Shopify access token must be a string'),
    body('accounting.quickbooks.enabled').optional().isBoolean(),
    body('accounting.quickbooks.realmId')
      .optional({ nullable: true })
      .isString()
      .withMessage('QuickBooks realm ID must be a string'),
    body('accounting.quickbooks.clientId')
      .optional({ nullable: true })
      .isString()
      .withMessage('QuickBooks client ID must be a string'),
    body('accounting.quickbooks.clientSecret')
      .optional({ nullable: true })
      .isString()
      .withMessage('QuickBooks client secret must be a string'),
    body('crm.hubspot.enabled').optional().isBoolean(),
    body('crm.hubspot.apiKey')
      .optional({ nullable: true })
      .isString()
      .withMessage('HubSpot API key must be a string'),
    body('webhooks.enabled').optional().isBoolean(),
    body('webhooks.url')
      .optional({ nullable: true })
      .isString()
      .withMessage('Webhook URL must be a string'),
    body('webhooks.secret')
      .optional({ nullable: true })
      .isString()
      .withMessage('Webhook secret must be a string'),
    validate,
  ],
  auditMiddleware({
    action: 'update',
    entityType: 'settings',
    metadataBuilder: () => ({ section: 'integrations' }),
  }),
  settingsController.updateIntegrationSettings
);

// GET /api/settings/compliance
router.get(
  '/compliance',
  auditMiddleware({
    action: 'read',
    entityType: 'settings',
    metadataBuilder: () => ({ section: 'compliance' }),
  }),
  settingsController.getComplianceSettings
);

router.put(
  '/compliance',
  [
    body('requireTwoFactor').optional().isBoolean(),
    body('sessionTimeoutMinutes')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Session timeout must be zero or greater'),
    body('dataRetentionDays')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Data retention days must be zero or greater'),
    body('allowDataExport').optional().isBoolean(),
    body('autoPurgeAuditLogs').optional().isBoolean(),
    body('auditNotificationEmails')
      .optional()
      .isArray()
      .withMessage('Audit notification emails must be an array'),
    body('auditNotificationEmails.*')
      .optional()
      .isEmail()
      .withMessage('Audit notification emails must be valid email addresses'),
    validate,
  ],
  auditMiddleware({
    action: 'update',
    entityType: 'settings',
    metadataBuilder: () => ({ section: 'compliance' }),
  }),
  settingsController.updateComplianceSettings
);

export default router;
