import { getTenantConnection } from '../config/database';
import { ProductSchema } from '../models/product.model';
import { CategorySchema } from '../models/category.model';
import { SaleSchema } from '../models/sale.model';
import { SyncDeviceSchema } from '../models/syncDevice.model';
import { POSService } from './pos.service';
import { logger } from '../utils/logger';
import { Types } from 'mongoose';

type DeviceContext = {
  deviceId: string;
  label?: string;
  storeId?: string;
  location?: string;
  queueSize?: number;
  appVersion?: string;
  platform?: string;
  metadata?: Record<string, any>;
};

const toObjectId = (value?: string) => {
  if (!value) return undefined;
  if (Types.ObjectId.isValid(value)) {
    return new Types.ObjectId(value);
  }
  return undefined;
};

export class SyncService {
  private posService: POSService;

  constructor() {
    this.posService = new POSService();
  }

  private async upsertDevice(
    tenantId: string,
    device: DeviceContext | undefined,
    updates: Record<string, unknown>
  ) {
    if (!device?.deviceId) {
      return null;
    }

    const connection = await getTenantConnection(tenantId);
    const SyncDevice = connection.model('SyncDevice', SyncDeviceSchema);

    const payload: Record<string, unknown> = {
      tenantId,
      deviceId: device.deviceId,
      label: device.label,
      store: toObjectId(device.storeId),
      location: device.location,
      appVersion: device.appVersion,
      platform: device.platform,
      metadata: device.metadata,
      ...updates,
    };

    if (typeof device.queueSize === 'number' && device.queueSize >= 0) {
      payload.queueSize = device.queueSize;
    }

    const record = await SyncDevice.findOneAndUpdate(
      { tenantId, deviceId: device.deviceId },
      {
        $set: {
          status: 'online',
          lastSeenAt: new Date(),
          ...payload,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return record;
  }

  /**
   * Pull data for offline cache
   * Get all products and categories since last sync
   */
  async pullData(
    tenantId: string,
    device?: DeviceContext,
    lastSync?: Date
  ): Promise<{
    products: any[];
    categories: any[];
    timestamp: Date;
    device?: any;
  }> {
    try {
      const connection = await getTenantConnection(tenantId);
      const Product = connection.model('Product', ProductSchema);
      const Category = connection.model('Category', CategorySchema);

      const query: any = { isActive: true };

      if (lastSync) {
        query.updatedAt = { $gte: lastSync };
      }

      const [products, categories, deviceRecord] = await Promise.all([
        Product.find(query)
          .populate('category', 'name color icon')
          .select('-createdBy -updatedBy')
          .lean(),
        Category.find({ isActive: true })
          .select('-createdBy -updatedBy')
          .lean(),
        this.upsertDevice(tenantId, device, {
          lastPullAt: new Date(),
          lastSyncAt: new Date(),
        }),
      ]);

      logger.info(
        `Sync pull: ${products.length} products, ${categories.length} categories`
      );

      return {
        products,
        categories,
        timestamp: new Date(),
        device: deviceRecord || undefined,
      };
    } catch (error) {
      logger.error('Error pulling sync data:', error);
      throw error;
    }
  }

  /**
   * Push offline sales to server
   */
  async pushSales(
    tenantId: string,
    userId: string,
    sales: any[],
    device?: DeviceContext
  ): Promise<{
    success: number;
    failed: number;
    conflicts: number;
    errors: any[];
    device?: any;
  }> {
    const results = {
      success: 0,
      failed: 0,
      conflicts: 0,
      errors: [] as any[],
    };

    const connection = await getTenantConnection(tenantId);
    const Sale = connection.model('Sale', SaleSchema);

    for (const saleData of sales) {
      try {
        // Check if already synced (by clientId)
        if (saleData.clientId) {
          const existing = await Sale.findOne({ clientId: saleData.clientId });
          if (existing) {
            logger.info(`Sale already synced: ${saleData.clientId}`);
            results.success++;
            continue;
          }
        }

        // Create sale using POS service
        const sale = await this.posService.createSale(tenantId, userId, {
          storeId: saleData.storeId,
          customerId: saleData.customerId,
          items: saleData.items,
          discount: saleData.discount,
          discountType: saleData.discountType,
          payments: saleData.payments,
          notes: saleData.notes,
        });

        // Update with offline metadata
        if (saleData.clientId) {
          sale.clientId = saleData.clientId;
          sale.offlineCreatedAt = saleData.offlineCreatedAt || sale.createdAt;
          sale.syncedAt = new Date();
          sale.syncStatus = 'synced';
          await sale.save();
        }

        results.success++;
      } catch (error: any) {
        if (error.message?.includes('Insufficient stock')) {
          results.conflicts++;
          results.errors.push({
            clientId: saleData.clientId,
            error: 'stock_conflict',
            message: error.message,
          });
        } else {
          results.failed++;
          results.errors.push({
            clientId: saleData.clientId,
            error: 'sync_failed',
            message: error.message,
          });
        }
      }
    }

    const deviceRecord = await this.upsertDevice(tenantId, device, {
      lastPushAt: new Date(),
      lastSyncAt: new Date(),
      queueSize:
        typeof device?.queueSize === 'number'
          ? Math.max(device.queueSize - results.success, 0)
          : undefined,
      conflicts: results.conflicts,
    });

    logger.info(
      `Sync push completed: ${results.success} success, ${results.failed} failed, ${results.conflicts} conflicts`
    );

    return {
      ...results,
      device: deviceRecord || undefined,
    };
  }

  /**
   * Get sync status for a device
   */
  async getSyncStatus(
    tenantId: string,
    deviceId: string
  ): Promise<{
    device?: any;
    pendingSales: number;
    conflicts: number;
    lastSyncAt?: Date;
  }> {
    try {
      const connection = await getTenantConnection(tenantId);
      const Sale = connection.model('Sale', SaleSchema);
      const SyncDevice = connection.model('SyncDevice', SyncDeviceSchema);

      const [conflicts, device] = await Promise.all([
        Sale.countDocuments({
          syncStatus: 'conflict',
        }),
        SyncDevice.findOne({ tenantId, deviceId }).lean(),
      ]);

      return {
        device: device || undefined,
        pendingSales: Math.max(device?.queueSize ?? 0, 0),
        conflicts,
        lastSyncAt: device?.lastSyncAt,
      };
    } catch (error) {
      logger.error('Error getting sync status:', error);
      throw error;
    }
  }

  /**
   * List all registered devices with summary
   */
  async listDevices(
    tenantId: string
  ): Promise<{
    count: number;
    online: number;
    offline: number;
    degraded: number;
    devices: any[];
  }> {
    const connection = await getTenantConnection(tenantId);
    const SyncDevice = connection.model('SyncDevice', SyncDeviceSchema);

    const devices = await SyncDevice.find().sort({ updatedAt: -1 }).lean();

    return {
      count: devices.length,
      online: devices.filter((d) => d.status === 'online').length,
      offline: devices.filter((d) => d.status === 'offline').length,
      degraded: devices.filter((d) => d.status === 'degraded').length,
      devices: devices.map((device) => ({
        id: device.deviceId,
        label: device.label,
        status: device.status,
        lastSeenAt: device.lastSeenAt,
        lastSyncAt: device.lastSyncAt,
        lastPullAt: device.lastPullAt,
        lastPushAt: device.lastPushAt,
        queueSize: device.queueSize,
        conflicts: device.conflicts,
        location: device.location,
        store: device.store,
        appVersion: device.appVersion,
        platform: device.platform,
      })),
    };
  }
}

