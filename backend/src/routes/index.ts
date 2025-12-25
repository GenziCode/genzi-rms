import { Router } from 'express';
import tenantRoutes from './tenant.routes';
import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';
import categoryReportsRoutes from './categoryReports.routes';
import categoryNotificationRoutes from './categoryNotification.routes';
import categoryBulkOperationsRoutes from './categoryBulkOperations.routes';
import categoryTemplateRoutes from './categoryTemplate.routes';
import categoryAnalyticsRoutes from './categoryAnalytics.routes';
import categoryComparisonRoutes from './categoryComparison.routes';
import categorySharingRoutes from './categorySharing.routes';
import categoryAccessRoutes from './categoryAccess.routes';
import categoryAuditRoutes from './categoryAudit.routes';
import categoryBackupRoutes from './categoryBackup.routes';
import categoryTagRoutes from './categoryTag.routes';
import categoryWorkflowRoutes from './categoryWorkflow.routes';
import categoryAutomationRuleRoutes from './categoryAutomationRule.routes';
import categoryPermissionRoutes from './categoryPermission.routes';
import categoryValidationRuleRoutes from './categoryValidationRule.routes';
import categoryCollaborationRoutes from './categoryCollaboration.routes';
import categoryApprovalRoutes from './categoryApproval.routes';
import categorySecurityRoutes from './categorySecurity.routes';
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
import { Request, Response, NextFunction } from 'express';

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
router.use('/categories', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), categoryRoutes);
router.use('/reports/categories', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), categoryReportsRoutes);
router.use('/notifications/categories', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), categoryNotificationRoutes);
router.use('/categories/templates', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), categoryTemplateRoutes);
router.use('/analytics/categories', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), categoryAnalyticsRoutes);
router.use('/categories', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), categoryComparisonRoutes);
router.use('/categories', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), categorySharingRoutes);
router.use('/categories', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), categoryAccessRoutes);
router.use('/categories', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), categoryAuditRoutes);
router.use('/categories', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), categoryBackupRoutes);
router.use('/category-tags', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), categoryTagRoutes);
router.use('/category-workflows', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), categoryWorkflowRoutes);
router.use('/category-automation-rules', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), categoryAutomationRuleRoutes);
router.use('/category-permissions', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), categoryPermissionRoutes);
router.use('/category-validation-rules', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), categoryValidationRuleRoutes);
router.use('/category-collaborations', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), categoryCollaborationRoutes);
router.use('/category-security', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), categorySecurityRoutes);
router.use('/category-approvals', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), categoryApprovalRoutes);
// Mount bulk operations routes
router.use('/categories/bulk', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), categoryBulkOperationsRoutes);
router.use('/products', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), productRoutes);
router.use('/sales', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), posRoutes);
router.use('/inventory', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), inventoryRoutes);
router.use('/reports/inventory', inventoryReportsRoutes);
router.use('/reports/financial', financialReportsRoutes);
router.use('/reports/sales', salesReportsRoutes);
router.use('/customers', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), customerRoutes);
router.use('/vendors', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), vendorRoutes);
router.use('/stores', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), storeRoutes);
router.use('/purchase-orders', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), purchaseOrderRoutes);
router.use('/invoices', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), invoiceRoutes);
// router.use('/files', fileRoutes); // DISABLED - File uploads
router.use('/notifications', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), notificationRoutes);
router.use('/audit-logs', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), auditRoutes);
router.use('/payments', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), paymentRoutes);
router.use('/webhooks-config', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), systemWebhookRoutes);
router.use('/users', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), userRoutes);
router.use('/settings', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), settingsRoutes);
router.use('/reports', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), reportsRoutes);
router.use('/report-templates', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), reportTemplateRoutes);
router.use('/notification-templates', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), notificationTemplateRoutes);
router.use('/report-schedules', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), reportScheduleRoutes);
router.use('/stock-transfers', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), stockTransferRoutes);
router.use('/physical-audits', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), physicalAuditRoutes);
router.use('/inventory/forecasting', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), inventoryForecastRoutes);
router.use('/warehouses', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), warehouseRoutes);
router.use('/inventory/analytics', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), stockAnalyticsRoutes);
router.use('/export', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), exportRoutes);
router.use('/sync', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), syncRoutes);
router.use('/form-permissions', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), formPermissionRoutes);
router.use('/field-permissions', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), fieldPermissionRoutes);
router.use('/roles', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), roleRoutes);
router.use('/permissions', (req: Request, res: Response, next: NextFunction) => resolveTenant(req as any, res, next), permissionRoutes);

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
