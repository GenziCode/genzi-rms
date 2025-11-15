import mongoose from 'mongoose';
import { getTenantConnection } from '../../config/database';
import { ProductSchema, IProduct } from '../../models/product.model';
import { StockMovementSchema, IStockMovement } from '../../models/inventory.model';

interface AnalyticsFilters {
  storeId?: string;
  categoryId?: string;
  lookbackDays?: number;
  limit?: number;
}

export class StockAnalyticsService {
  private async getModels(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return {
      Product: connection.model<IProduct>('Product', ProductSchema),
      StockMovement:
        connection.models.StockMovement ||
        connection.model<IStockMovement>('StockMovement', StockMovementSchema),
    };
  }

  async getAgingBuckets(tenantId: string, filters: AnalyticsFilters = {}) {
    const { Product } = await this.getModels(tenantId);
    const match: Record<string, unknown> = { isActive: true };

    if (filters.storeId) {
      match.stores = {
        $elemMatch: { storeId: new mongoose.Types.ObjectId(filters.storeId) },
      };
    }
    if (filters.categoryId) {
      match.category = new mongoose.Types.ObjectId(filters.categoryId);
    }

    const pipeline = [
      { $match: match },
      {
        $project: {
          name: 1,
          sku: 1,
          currentStock: 1,
          lastMovementDate: 1,
          daysSinceMovement: {
            $divide: [
              { $subtract: [new Date(), { $ifNull: ['$lastMovementDate', new Date(0)] }] },
              1000 * 60 * 60 * 24,
            ],
          },
        },
      },
      {
        $bucket: {
          groupBy: '$daysSinceMovement',
          boundaries: [0, 30, 60, 90, 120, Number.MAX_SAFE_INTEGER],
          default: '120+',
          output: {
            products: { $push: '$$ROOT' },
            totalUnits: { $sum: '$currentStock' },
            count: { $sum: 1 },
          },
        },
      },
    ];

    const buckets = await Product.aggregate(pipeline);
    return buckets;
  }

  async getTurnover(tenantId: string, filters: AnalyticsFilters = {}) {
    const { StockMovement } = await this.getModels(tenantId);
    const lookbackDays = filters.lookbackDays ?? 90;
    const since = new Date();
    since.setDate(since.getDate() - lookbackDays);

    const match: Record<string, unknown> = {
      tenantId: new mongoose.Types.ObjectId(tenantId),
      type: 'sale',
      createdAt: { $gte: since },
    };

    if (filters.storeId) {
      match.store = new mongoose.Types.ObjectId(filters.storeId);
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: '$product',
          totalQty: { $sum: { $abs: '$quantity' } },
        },
      },
      {
        $project: {
          productId: '$_id',
          turnover: { $divide: ['$totalQty', lookbackDays / 30] },
        },
      },
      { $sort: { turnover: -1 } },
      { $limit: Math.min(filters.limit ?? 50, 200) },
    ];

    const results = await StockMovement.aggregate(pipeline);
    return results;
  }

  async getCongestion(tenantId: string, filters: AnalyticsFilters = {}) {
    const { StockMovement } = await this.getModels(tenantId);
    const lookbackDays = filters.lookbackDays ?? 30;
    const since = new Date();
    since.setDate(since.getDate() - lookbackDays);

    const match: Record<string, unknown> = {
      tenantId: new mongoose.Types.ObjectId(tenantId),
      createdAt: { $gte: since },
    };

    if (filters.storeId) {
      match.store = new mongoose.Types.ObjectId(filters.storeId);
    }

    const movements = await StockMovement.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            store: '$store',
            type: '$type',
          },
          count: { $sum: 1 },
        },
      },
    ]);

    return movements;
  }
}

export const stockAnalyticsService = new StockAnalyticsService();

