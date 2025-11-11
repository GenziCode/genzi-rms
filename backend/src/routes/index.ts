import { Router } from 'express';
import tenantRoutes from './tenant.routes';
import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';
import productRoutes from './product.routes';
import posRoutes from './pos.routes';
import inventoryRoutes from './inventory.routes';
import customerRoutes from './customer.routes';
import exportRoutes from './export.routes';
import syncRoutes from './sync.routes';
import vendorRoutes from './vendor.routes';
import purchaseOrderRoutes from './purchaseOrder.routes';
import userRoutes from './user.routes';
import settingsRoutes from './settings.routes';
import reportsRoutes from './reports.routes';
import { resolveTenant } from '../middleware/tenant.middleware';

const router = Router();

/**
 * Public routes (no tenant or auth required)
 */
router.use('/tenants', tenantRoutes);

/**
 * Tenant-specific routes (require tenant resolution)
 */
router.use('/auth', resolveTenant, authRoutes);

/**
 * Protected routes (require authentication and tenant)
 */
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/sales', posRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/customers', customerRoutes);
router.use('/vendors', vendorRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/users', userRoutes);
router.use('/settings', settingsRoutes);
router.use('/reports', reportsRoutes);
router.use('/export', exportRoutes);
router.use('/sync', syncRoutes);

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
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
