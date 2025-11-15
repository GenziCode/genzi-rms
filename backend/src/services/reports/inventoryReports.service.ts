/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Inventory report service relies on dynamic aggregation pipelines.
 * Using `any` in limited spots keeps the Mongo pipeline definitions pragmatic.
 */
import mongoose from 'mongoose';
import moment from 'moment-timezone';
import { getTenantConnection } from '../../config/database';
import { ProductSchema, IProduct } from '../../models/product.model';
import { StockMovementSchema, IStockMovement } from '../../models/inventory.model';

interface StockFilters {
  storeId?: string;
  categoryId?: string;
  threshold?: number;
}

interface StockMovementFilters {
  storeId?: string;
  productId?: string;
  type?: string;
  startDate?: Date;
  endDate?: Date;
}

interface CurrentStockResult {
  summary: {
    totalProducts: number;
    totalUnits: number;
    totalCostValue: number;
    potentialRevenue: number;
  };
  products: any[];
}

interface LowStockResult {
  totalLowStock: number;
  products: any[];
}

interface OverstockResult {
  totalOverstocked: number;
  excessUnits: number;
  excessValue: number;
  products: any[];
}

interface InventoryValuationResult {
  summary: {
    totalCostValue: number;
    totalRetailValue: number;
    totalUnits: number;
  };
  categories: any[];
}

interface StockMovementResult {
  movement: any[];
  summary: any[];
  dateRange: { startDate: Date; endDate: Date };
}

export class InventoryReportsService {
  private async getModels(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return {
      Product: connection.model<IProduct>('Product', ProductSchema),
      StockMovement:
        connection.models.StockMovement ||
        connection.model<IStockMovement>('StockMovement', StockMovementSchema),
    };
  }

  async getCurrentStockStatus(
    tenantId: string,
    filters: StockFilters
  ): Promise<CurrentStockResult> {
    const { Product } = await this.getModels(tenantId);

    const matchStage: Record<string, unknown> = {
      isActive: true,
    };

    if (filters.categoryId) {
      matchStage.category = new mongoose.Types.ObjectId(filters.categoryId);
    }

    const pipeline: Record<string, unknown>[] = [
      { $match: matchStage },
      {
        $project: {
          _id: 1,
          name: 1,
          sku: 1,
          category: 1,
          currentStock: 1,
          reorderPoint: 1,
          optimalStock: 1,
          unitCost: 1,
          unitPrice: 1,
          value: { $multiply: ['$currentStock', { $ifNull: ['$unitCost', 0] }] },
          potentialRevenue: { $multiply: ['$currentStock', { $ifNull: ['$unitPrice', 0] }] },
        },
      },
    ];

    if (filters.storeId) {
      pipeline.unshift({
        $match: {
          stores: { $elemMatch: { storeId: new mongoose.Types.ObjectId(filters.storeId) } },
        },
      });
    }

    const products = await Product.aggregate(pipeline);

    return {
      summary: {
        totalProducts: products.length,
        totalUnits: products.reduce((sum, product) => sum + (product.currentStock || 0), 0),
        totalCostValue: products.reduce((sum, product) => sum + (product.value || 0), 0),
        potentialRevenue: products.reduce(
          (sum, product) => sum + (product.potentialRevenue || 0),
          0
        ),
      },
      products,
    };
  }

  async getLowStockReport(
    tenantId: string,
    filters: StockFilters
  ): Promise<LowStockResult> {
    const { Product } = await this.getModels(tenantId);

    const pipeline: Record<string, unknown>[] = [
      { $match: { isActive: true } },
      {
        $project: {
          _id: 1,
          name: 1,
          sku: 1,
          category: 1,
          currentStock: 1,
          reorderPoint: 1,
          optimalStock: 1,
          unitCost: 1,
          unitPrice: 1,
          status: {
            $switch: {
              branches: [
                {
                  case: { $lte: ['$currentStock', 0] },
                  then: 'out_of_stock',
                },
                {
                  case: { $lte: ['$currentStock', '$reorderPoint'] },
                  then: 'low_stock',
                },
              ],
              default: 'healthy',
            },
          },
        },
      },
      { $match: { status: { $in: ['low_stock', 'out_of_stock'] } } },
    ];

    if (filters.categoryId) {
      pipeline.unshift({
        $match: {
          category: new mongoose.Types.ObjectId(filters.categoryId),
        },
      });
    }

    if (filters.storeId) {
      pipeline.unshift({
        $match: {
          stores: { $elemMatch: { storeId: new mongoose.Types.ObjectId(filters.storeId) } },
        },
      });
    }

    const products = await Product.aggregate(pipeline);

    return {
      totalLowStock: products.length,
      products,
    };
  }

  async getOverstockReport(
    tenantId: string,
    filters: StockFilters
  ): Promise<OverstockResult> {
    const { Product } = await this.getModels(tenantId);

    const pipeline: Record<string, unknown>[] = [
      { $match: { isActive: true, optimalStock: { $gt: 0 } } },
      {
        $project: {
          _id: 1,
          name: 1,
          sku: 1,
          category: 1,
          currentStock: 1,
          optimalStock: 1,
          excessUnits: {
            $subtract: ['$currentStock', '$optimalStock'],
          },
          unitCost: 1,
          excessValue: {
            $multiply: [
              { $subtract: ['$currentStock', '$optimalStock'] },
              { $ifNull: ['$unitCost', 0] },
            ],
          },
        },
      },
      { $match: { excessUnits: { $gt: filters.threshold ?? 0 } } },
      { $sort: { excessUnits: -1 } },
    ];

    if (filters.categoryId) {
      pipeline.unshift({
        $match: {
          category: new mongoose.Types.ObjectId(filters.categoryId),
        },
      });
    }

    if (filters.storeId) {
      pipeline.unshift({
        $match: {
          stores: { $elemMatch: { storeId: new mongoose.Types.ObjectId(filters.storeId) } },
        },
      });
    }

    const products = await Product.aggregate(pipeline);

    return {
      totalOverstocked: products.length,
      excessUnits: products.reduce((sum, product) => sum + product.excessUnits, 0),
      excessValue: products.reduce((sum, product) => sum + product.excessValue, 0),
      products,
    };
  }

  async getInventoryValuation(
    tenantId: string,
    filters: StockFilters
  ): Promise<InventoryValuationResult> {
    const { Product } = await this.getModels(tenantId);

    const pipeline: Record<string, unknown>[] = [
      { $match: { isActive: true } },
      {
        $project: {
          _id: 1,
          name: 1,
          category: 1,
          currentStock: 1,
          unitCost: 1,
          unitPrice: 1,
          costValue: { $multiply: ['$currentStock', { $ifNull: ['$unitCost', 0] }] },
          retailValue: { $multiply: ['$currentStock', { $ifNull: ['$unitPrice', 0] }] },
          markup: {
            $cond: [
              { $gt: ['$unitCost', 0] },
              {
                $multiply: [
                  { $divide: [{ $subtract: ['$unitPrice', '$unitCost'] }, '$unitCost'] },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $group: {
          _id: '$category',
          categoryId: { $first: '$category' },
          costValue: { $sum: '$costValue' },
          retailValue: { $sum: '$retailValue' },
          totalUnits: { $sum: '$currentStock' },
          averageMarkup: { $avg: '$markup' },
        },
      },
      { $sort: { retailValue: -1 } },
    ];

    if (filters.categoryId) {
      pipeline.unshift({
        $match: {
          category: new mongoose.Types.ObjectId(filters.categoryId),
        },
      });
    }

    if (filters.storeId) {
      pipeline.unshift({
        $match: {
          stores: { $elemMatch: { storeId: new mongoose.Types.ObjectId(filters.storeId) } },
        },
      });
    }

    const categories = await Product.aggregate(pipeline);

    return {
      summary: {
        totalCostValue: categories.reduce((sum, category) => sum + category.costValue, 0),
        totalRetailValue: categories.reduce((sum, category) => sum + category.retailValue, 0),
        totalUnits: categories.reduce((sum, category) => sum + category.totalUnits, 0),
      },
      categories,
    };
  }

  async getStockMovement(
    tenantId: string,
    filters: StockMovementFilters
  ): Promise<StockMovementResult> {
    const { StockMovement } = await this.getModels(tenantId);

    const startDate = filters.startDate || moment().subtract(30, 'days').startOf('day').toDate();
    const endDate = filters.endDate || moment().endOf('day').toDate();

    const matchStage: Record<string, unknown> = {
      tenantId: new mongoose.Types.ObjectId(tenantId),
      createdAt: { $gte: startDate, $lte: endDate },
    };

    if (filters.storeId) {
      matchStage.store = new mongoose.Types.ObjectId(filters.storeId);
    }

    if (filters.productId) {
      matchStage.product = new mongoose.Types.ObjectId(filters.productId);
    }

    if (filters.type) {
      matchStage.type = filters.type;
    }

    const movement = await StockMovement.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'stores',
          localField: 'store',
          foreignField: '_id',
          as: 'store',
        },
      },
      { $unwind: '$store' },
      {
        $project: {
          _id: 1,
          productId: '$product._id',
          productName: '$product.name',
          sku: '$product.sku',
          storeId: '$store._id',
          storeName: '$store.name',
          type: 1,
          quantity: 1,
          quantityBefore: 1,
          quantityAfter: 1,
          reason: 1,
          referenceType: 1,
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 500 },
    ]);

    const summary = await StockMovement.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          totalMovements: { $sum: 1 },
          totalUnits: { $sum: '$quantity' },
        },
      },
    ]);

    return {
      movement,
      summary,
      dateRange: { startDate, endDate },
    };
  }
}

export const inventoryReportsService = new InventoryReportsService();