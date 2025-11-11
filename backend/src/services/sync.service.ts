import { getTenantConnection } from '../config/database';
import { ProductSchema } from '../models/product.model';
import { CategorySchema } from '../models/category.model';
import { SaleSchema, ISale } from '../models/sale.model';
import { POSService } from './pos.service';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export class SyncService {
  private posService: POSService;

  constructor() {
    this.posService = new POSService();
  }

  /**
   * Pull data for offline cache
   * Get all products and categories since last sync
   */
  async pullData(
    tenantId: string,
    lastSync?: Date
  ): Promise<{
    products: any[];
    categories: any[];
    timestamp: Date;
  }> {
    try {
      const connection = await getTenantConnection(tenantId);
      const Product = connection.model('Product', ProductSchema);
      const Category = connection.model('Category', CategorySchema);

      const query: any = { isActive: true };

      if (lastSync) {
        query.updatedAt = { $gte: lastSync };
      }

      const products = await Product.find(query)
        .populate('category', 'name color icon')
        .select('-createdBy -updatedBy')
        .lean();

      const categories = await Category.find({ isActive: true })
        .select('-createdBy -updatedBy')
        .lean();

      logger.info(
        `Sync pull: ${products.length} products, ${categories.length} categories`
      );

      return {
        products,
        categories,
        timestamp: new Date(),
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
    sales: any[]
  ): Promise<{
    success: number;
    failed: number;
    conflicts: number;
    errors: any[];
  }> {
    const results = {
      success: 0,
      failed: 0,
      conflicts: 0,
      errors: [] as any[],
    };

    for (const saleData of sales) {
      try {
        const connection = await getTenantConnection(tenantId);
        const Sale = connection.model('Sale', SaleSchema);

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

    logger.info(
      `Sync push completed: ${results.success} success, ${results.failed} failed, ${results.conflicts} conflicts`
    );

    return results;
  }

  /**
   * Get sync status for a device
   */
  async getSyncStatus(
    tenantId: string,
    deviceId: string
  ): Promise<{
    lastSync?: Date;
    pendingSales: number;
    conflicts: number;
  }> {
    try {
      const connection = await getTenantConnection(tenantId);
      const Sale = connection.model('Sale', SaleSchema);

      // Count sales in conflict state
      const conflicts = await Sale.countDocuments({
        syncStatus: 'conflict',
      });

      return {
        pendingSales: 0, // Would be tracked client-side
        conflicts,
      };
    } catch (error) {
      logger.error('Error getting sync status:', error);
      throw error;
    }
  }
}

