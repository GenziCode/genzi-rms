import mongoose from 'mongoose';
import { getTenantConnection } from '../config/database';
import { StockMovementSchema, IStockMovement } from '../models/inventory.model';
import { ProductSchema, IProduct } from '../models/product.model';
import {
  ForecastOverrideSchema,
  IForecastOverride,
} from '../models/forecastOverride.model';

interface ForecastFilters {
  storeId?: string;
  lookbackDays?: number;
  minVelocity?: number;
  limit?: number;
}

interface OverridePayload {
  leadTimeDays?: number;
  safetyStockDays?: number;
  notes?: string;
}

export class InventoryForecastService {
  private async getStockMovementModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<IStockMovement>('StockMovement', StockMovementSchema);
  }

  private async getProductModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<IProduct>('Product', ProductSchema);
  }

  private async getOverrideModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<IForecastOverride>('ForecastOverride', ForecastOverrideSchema);
  }

  async getForecasts(tenantId: string, filters: ForecastFilters = {}): Promise<{
    forecasts: any[];
    metadata: {
      generatedAt: Date;
      lookbackDays: number;
      totalProducts: number;
    };
  }> {
    const StockMovement = await this.getStockMovementModel(tenantId);
    const Product = await this.getProductModel(tenantId);
    const ForecastOverride = await this.getOverrideModel(tenantId);

    const lookbackDays = filters.lookbackDays ?? 90;
    const limit = Math.min(filters.limit ?? 200, 500);
    const since = new Date();
    since.setDate(since.getDate() - lookbackDays);

    const match: Record<string, unknown> = {
      tenantId: new mongoose.Types.ObjectId(tenantId),
      type: { $in: ['sale', 'transfer_out'] },
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
          daysSeen: {
            $addToSet: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
          },
        },
      },
      {
        $project: {
          productId: '$_id',
          totalQty: 1,
          avgDailyDemand: {
            $divide: ['$totalQty', { $max: [{ $size: '$daysSeen' }, 1] }],
          },
        },
      },
      {
        $match: filters.minVelocity
          ? { avgDailyDemand: { $gte: filters.minVelocity } }
          : {},
      },
      { $sort: { avgDailyDemand: -1 as const } },
      { $limit: limit },
    ];

    const aggregates = await StockMovement.aggregate(pipeline as any);

    if (!aggregates.length) {
      return {
        forecasts: [],
        metadata: {
          generatedAt: new Date(),
          lookbackDays,
          totalProducts: 0,
        },
      };
    }

    const productIds = aggregates.map((item) => item.productId);

    const products = await Product.find(
      { _id: { $in: productIds } },
      'name sku stock unit reorderPoint reorderQuantity minStock'
    ).lean();

    const productMap = new Map(
      products.map((product) => [product._id.toString(), product])
    );

    const overrides = await ForecastOverride.find({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      product: { $in: productIds },
    }).lean();

    const overrideMap = new Map(
      overrides.map((override) => [override.product.toString(), override])
    );

    const forecasts = aggregates
      .map((aggregate) => {
        const product = productMap.get(aggregate.productId.toString());
        if (!product) {
          return undefined;
        }

        const override = overrideMap.get(aggregate.productId.toString());
        const leadTimeDays = override?.leadTimeDays ?? 5;
        const safetyStockDays = override?.safetyStockDays ?? 3;
        const avgDailyDemand = Number(aggregate.avgDailyDemand.toFixed(2));
        const onHand = product.stock ?? 0;
        const safetyStock = Math.round(avgDailyDemand * safetyStockDays);
        const reorderPoint = Math.round(avgDailyDemand * leadTimeDays + safetyStock);
        const reorderQuantity =
          product.reorderQuantity ?? Math.max(Math.round(avgDailyDemand * (leadTimeDays || 1)), 1);

        return {
          product: {
            id: product._id,
            name: product.name,
            sku: product.sku,
            unit: product.unit,
          },
          avgDailyDemand,
          totalMovement: aggregate.totalQty,
          onHand,
          leadTimeDays,
          safetyStockDays,
          safetyStock,
          reorderPoint,
          reorderQuantity,
          projectedDaysRemaining:
            avgDailyDemand > 0 ? Number((onHand / avgDailyDemand).toFixed(1)) : null,
          override: override
            ? {
                leadTimeDays: override.leadTimeDays,
                safetyStockDays: override.safetyStockDays,
                notes: override.notes,
                updatedAt: override.updatedAt,
              }
            : undefined,
        };
      })
      .filter(Boolean);

    return {
      forecasts,
      metadata: {
        generatedAt: new Date(),
        lookbackDays,
        totalProducts: forecasts.length,
      },
    };
  }

  async upsertOverride(
    tenantId: string,
    productId: string,
    payload: OverridePayload,
    userId: string
  ): Promise<IForecastOverride> {
    const ForecastOverride = await this.getOverrideModel(tenantId);

    const override = await ForecastOverride.findOneAndUpdate(
      {
        tenantId: new mongoose.Types.ObjectId(tenantId),
        product: new mongoose.Types.ObjectId(productId),
      },
      {
        $set: {
          leadTimeDays: payload.leadTimeDays,
          safetyStockDays: payload.safetyStockDays,
          notes: payload.notes,
          updatedBy: new mongoose.Types.ObjectId(userId),
        },
      },
      { new: true, upsert: true }
    );

    return override;
  }
}

export const inventoryForecastService = new InventoryForecastService();

