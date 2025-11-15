import { Router } from 'express';
import tenantRoutes from './tenant.routes';
import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';
import productRoutes from './product.routes';
import posRoutes from './pos.routes';
import inventoryRoutes from './inventory.routes';
import inventoryReportsRoutes from './inventoryReports.routes';
import financialReportsRoutes from './financialReports.routes';
import salesReportsRoutes from './salesReports.routes';
import customerRoutes from './customer.routes';
import exportRoutes from './export.routes';
import syncRoutes from './sync.routes';
import vendorRoutes from './vendor.routes';
import purchaseOrderRoutes from './purchaseOrder.routes';
import invoiceRoutes from './invoice.routes';
// import fileRoutes from './file.routes'; // DISABLED - File uploads
import notificationRoutes from './notification.routes';
import auditRoutes from './audit.routes';
import paymentRoutes from './payment.routes';
import webhookRoutes from './webhook.routes';
import systemWebhookRoutes from './system-webhook.routes';
import userRoutes from './user.routes';
import storeRoutes from './store.routes';
import settingsRoutes from './settings.routes';
import reportsRoutes from './reports.routes';
import reportTemplateRoutes from './reportTemplate.routes';
import reportScheduleRoutes from './reportSchedule.routes';
import formPermissionRoutes from './formPermission.routes';
import fieldPermissionRoutes from './fieldPermission.routes';
import roleRoutes from './role.routes';
import permissionRoutes from './permission.routes';
import stockTransferRoutes from './stockTransfer.routes';
import physicalAuditRoutes from './physicalAudit.routes';
import inventoryForecastRoutes from './inventoryForecast.routes';
import warehouseRoutes from './warehouse.routes';
import stockAnalyticsRoutes from './stockAnalytics.routes';
import notificationTemplateRoutes from './notificationTemplate.routes';
import { resolveTenant } from '../middleware/tenant.middleware';

const router = Router();

/**
 * Public routes (no tenant or auth required)
 */
router.use('/tenants', tenantRoutes);

/**
 * Webhook routes (no auth required, verified by signature)
 */
router.use('/webhooks', webhookRoutes);

/**
 * Auth routes (login doesn't need tenant resolution, other auth endpoints do)
 */
router.use('/auth', authRoutes);

/**
 * Protected routes (require authentication and tenant)
 */
router.use('/categories', resolveTenant, categoryRoutes);
router.use('/products', resolveTenant, productRoutes);
router.use('/sales', resolveTenant, posRoutes);
router.use('/inventory', resolveTenant, inventoryRoutes);
router.use('/reports/inventory', inventoryReportsRoutes);
router.use('/reports/financial', financialReportsRoutes);
router.use('/reports/sales', salesReportsRoutes);
router.use('/customers', resolveTenant, customerRoutes);
router.use('/vendors', resolveTenant, vendorRoutes);
router.use('/stores', resolveTenant, storeRoutes);
router.use('/purchase-orders', resolveTenant, purchaseOrderRoutes);
router.use('/invoices', resolveTenant, invoiceRoutes);
// router.use('/files', fileRoutes); // DISABLED - File uploads
router.use('/notifications', resolveTenant, notificationRoutes);
router.use('/audit-logs', resolveTenant, auditRoutes);
router.use('/payments', resolveTenant, paymentRoutes);
router.use('/webhooks-config', resolveTenant, systemWebhookRoutes);
router.use('/users', resolveTenant, userRoutes);
router.use('/settings', resolveTenant, settingsRoutes);
router.use('/reports', resolveTenant, reportsRoutes);
router.use('/report-templates', resolveTenant, reportTemplateRoutes);
router.use('/notification-templates', resolveTenant, notificationTemplateRoutes);
router.use('/report-schedules', resolveTenant, reportScheduleRoutes);
router.use('/stock-transfers', resolveTenant, stockTransferRoutes);
router.use('/physical-audits', resolveTenant, physicalAuditRoutes);
router.use('/inventory/forecasting', resolveTenant, inventoryForecastRoutes);
router.use('/warehouses', resolveTenant, warehouseRoutes);
router.use('/inventory/analytics', resolveTenant, stockAnalyticsRoutes);
router.use('/export', resolveTenant, exportRoutes);
router.use('/sync', resolveTenant, syncRoutes);
router.use('/form-permissions', resolveTenant, formPermissionRoutes);
router.use('/field-permissions', resolveTenant, fieldPermissionRoutes);
router.use('/roles', resolveTenant, roleRoutes);
router.use('/permissions', resolveTenant, permissionRoutes);

/**
 * Health check endpoint
 */
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

export default router;
