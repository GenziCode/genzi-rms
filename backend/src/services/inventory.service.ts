import { Connection } from 'mongoose';
import { getTenantConnection } from '../config/database';
import {
  StockMovementSchema,
  IStockMovement,
  StockAlertSchema,
  IStockAlert,
} from '../models/inventory.model';
import { ProductSchema, IProduct } from '../models/product.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

interface AdjustStockData {
  productId: string;
  storeId: string;
  quantity: number; // Positive to add, negative to remove
  type: 'adjustment' | 'restock' | 'damage' | 'return' | 'initial';
  reason?: string;
  notes?: string;
}

export class InventoryService {
  private async getStockMovementModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<IStockMovement>('StockMovement', StockMovementSchema);
  }

  private async getStockAlertModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<IStockAlert>('StockAlert', StockAlertSchema);
  }

  private async getProductModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<IProduct>('Product', ProductSchema);
  }

  /**
   * Record a stock movement
   */
  private async recordMovement(
    tenantId: string,
    userId: string,
    data: {
      productId: string;
      storeId: string;
      type: IStockMovement['type'];
      quantity: number;
      quantityBefore: number;
      quantityAfter: number;
      reason?: string;
      reference?: string;
      referenceType?: string;
      notes?: string;
    }
  ): Promise<IStockMovement> {
    const StockMovement = await this.getStockMovementModel(tenantId);

    const movement = new StockMovement({
      tenantId,
      product: data.productId,
      store: data.storeId,
      type: data.type,
      quantity: data.quantity,
      quantityBefore: data.quantityBefore,
      quantityAfter: data.quantityAfter,
      reason: data.reason,
      reference: data.reference,
      referenceType: data.referenceType,
      notes: data.notes,
      createdBy: userId,
    });

    await movement.save();
    return movement;
  }

  /**
   * Check and create/update stock alerts
   */
  private async checkStockAlerts(
    tenantId: string,
    productId: string,
    storeId: string,
    currentStock: number,
    minStock?: number,
    maxStock?: number
  ): Promise<void> {
    const StockAlert = await this.getStockAlertModel(tenantId);

    // Check for out of stock
    if (currentStock === 0) {
      const existing = await StockAlert.findOne({
        product: productId,
        store: storeId,
        type: 'out_of_stock',
        status: 'active',
      });

      if (!existing) {
        await new StockAlert({
          tenantId,
          product: productId,
          store: storeId,
          type: 'out_of_stock',
          threshold: 0,
          currentStock: 0,
          status: 'active',
        }).save();
        logger.info(`Out of stock alert created for product: ${productId}`);
      }
    } else {
      // Resolve out of stock alert if stock is restored
      await StockAlert.updateMany(
        {
          product: productId,
          store: storeId,
          type: 'out_of_stock',
          status: 'active',
        },
        {
          status: 'resolved',
          resolvedAt: new Date(),
        }
      );
    }

    // Check for low stock
    if (minStock !== undefined && currentStock > 0 && currentStock <= minStock) {
      const existing = await StockAlert.findOne({
        product: productId,
        store: storeId,
        type: 'low_stock',
        status: 'active',
      });

      if (!existing) {
        await new StockAlert({
          tenantId,
          product: productId,
          store: storeId,
          type: 'low_stock',
          threshold: minStock,
          currentStock,
          status: 'active',
        }).save();
        logger.info(`Low stock alert created for product: ${productId}`);
      } else if (existing.currentStock !== currentStock) {
        existing.currentStock = currentStock;
        await existing.save();
      }
    } else {
      // Resolve low stock alert if stock is restored
      await StockAlert.updateMany(
        {
          product: productId,
          store: storeId,
          type: 'low_stock',
          status: 'active',
        },
        {
          status: 'resolved',
          resolvedAt: new Date(),
        }
      );
    }

    // Check for overstock
    if (maxStock !== undefined && currentStock > maxStock) {
      const existing = await StockAlert.findOne({
        product: productId,
        store: storeId,
        type: 'overstock',
        status: 'active',
      });

      if (!existing) {
        await new StockAlert({
          tenantId,
          product: productId,
          store: storeId,
          type: 'overstock',
          threshold: maxStock,
          currentStock,
          status: 'active',
        }).save();
        logger.info(`Overstock alert created for product: ${productId}`);
      }
    } else {
      // Resolve overstock alert
      await StockAlert.updateMany(
        {
          product: productId,
          store: storeId,
          type: 'overstock',
          status: 'active',
        },
        {
          status: 'resolved',
          resolvedAt: new Date(),
        }
      );
    }
  }

  /**
   * Adjust stock manually
   */
  async adjustStock(
    tenantId: string,
    userId: string,
    data: AdjustStockData
  ): Promise<IProduct> {
    try {
      const Product = await this.getProductModel(tenantId);

      const product = await Product.findById(data.productId);
      if (!product) {
        throw new AppError('Product not found', 404);
      }

      if (!product.trackInventory) {
        throw new AppError('Inventory tracking not enabled for this product', 400);
      }

      const quantityBefore = product.stock || 0;
      const quantityAfter = quantityBefore + data.quantity;

      if (quantityAfter < 0) {
        throw new AppError('Insufficient stock for this adjustment', 400);
      }

      // Update product stock
      product.stock = quantityAfter;
      await product.save();

      // Record movement
      await this.recordMovement(tenantId, userId, {
        productId: data.productId,
        storeId: data.storeId,
        type: data.type,
        quantity: data.quantity,
        quantityBefore,
        quantityAfter,
        reason: data.reason,
        notes: data.notes,
      });

      // Check and update alerts
      await this.checkStockAlerts(
        tenantId,
        data.productId,
        data.storeId,
        quantityAfter,
        product.minStock,
        product.maxStock
      );

      logger.info(
        `Stock adjusted for ${product.name}: ${quantityBefore} → ${quantityAfter}`
      );

      return product;
    } catch (error) {
      logger.error('Error adjusting stock:', error);
      throw error;
    }
  }

  /**
   * Get stock movement history
   */
  async getMovementHistory(
    tenantId: string,
    options: {
      productId?: string;
      storeId?: string;
      type?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    movements: IStockMovement[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const StockMovement = await this.getStockMovementModel(tenantId);

      const {
        productId,
        storeId,
        type,
        startDate,
        endDate,
        page = 1,
        limit = 50,
      } = options;

      const query: any = {};

      if (productId) query.product = productId;
      if (storeId) query.store = storeId;
      if (type) query.type = type;

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = startDate;
        if (endDate) query.createdAt.$lte = endDate;
      }

      const total = await StockMovement.countDocuments(query);

      const movements = await StockMovement.find(query)
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('product', 'name sku');

      return {
        movements,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error getting movement history:', error);
      throw error;
    }
  }

  /**
   * Get active stock alerts
   */
  async getActiveAlerts(
    tenantId: string,
    options: {
      type?: string;
      storeId?: string;
      status?: string;
    } = {}
  ): Promise<IStockAlert[]> {
    try {
      const StockAlert = await this.getStockAlertModel(tenantId);

      const query: any = { status: options.status || 'active' };

      if (options.type) query.type = options.type;
      if (options.storeId) query.store = options.storeId;

      const alerts = await StockAlert.find(query)
        .sort('-createdAt')
        .populate('product', 'name sku minStock');

      return alerts;
    } catch (error) {
      logger.error('Error getting alerts:', error);
      throw error;
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(
    tenantId: string,
    alertId: string,
    userId: string
  ): Promise<IStockAlert> {
    try {
      const StockAlert = await this.getStockAlertModel(tenantId);

      const alert = await StockAlert.findById(alertId);
      if (!alert) {
        throw new AppError('Alert not found', 404);
      }

      alert.status = 'acknowledged';
      alert.acknowledgedBy = userId as any;
      alert.acknowledgedAt = new Date();

      await alert.save();

      return alert;
    } catch (error) {
      logger.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  /**
   * Get inventory valuation
   */
  async getInventoryValuation(
    tenantId: string,
    storeId?: string
  ): Promise<{
    totalValue: number;
    totalItems: number;
    products: Array<{
      product: any;
      quantity: number;
      cost: number;
      value: number;
    }>;
  }> {
    try {
      const Product = await this.getProductModel(tenantId);

      const query: any = { trackInventory: true, isActive: true };

      const products = await Product.find(query);

      let totalValue = 0;
      let totalItems = 0;

      const productValues = products.map((p) => {
        const quantity = p.stock || 0;
        const cost = p.cost || 0;
        const value = quantity * cost;

        totalValue += value;
        totalItems += quantity;

        return {
          product: {
            _id: p._id,
            name: p.name,
            sku: p.sku,
          },
          quantity,
          cost,
          value,
        };
      });

      return {
        totalValue,
        totalItems,
        products: productValues,
      };
    } catch (error) {
      logger.error('Error getting inventory valuation:', error);
      throw error;
    }
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(
    tenantId: string,
    storeId?: string
  ): Promise<IProduct[]> {
    try {
      const Product = await this.getProductModel(tenantId);

      const products = await Product.find({
        trackInventory: true,
        isActive: true,
        $expr: { $lte: ['$stock', '$minStock'] },
      })
        .populate('category', 'name color')
        .sort('stock');

      return products;
    } catch (error) {
      logger.error('Error getting low stock products:', error);
      throw error;
    }
  }

  /**
   * Get inventory status summary
   */
  async getInventoryStatus(
    tenantId: string,
    storeId?: string
  ): Promise<{
    totalProducts: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
    alerts: {
      active: number;
      lowStock: number;
      outOfStock: number;
      overstock: number;
    };
  }> {
    try {
      const Product = await this.getProductModel(tenantId);
      const StockAlert = await this.getStockAlertModel(tenantId);

      const products = await Product.find({
        trackInventory: true,
        isActive: true,
      });

      let totalValue = 0;
      let inStock = 0;
      let lowStock = 0;
      let outOfStock = 0;

      products.forEach((p) => {
        const stock = p.stock || 0;
        const cost = p.cost || 0;
        totalValue += stock * cost;

        if (stock === 0) {
          outOfStock++;
        } else if (p.minStock && stock <= p.minStock) {
          lowStock++;
        } else {
          inStock++;
        }
      });

      // Get alert counts
      const activeAlerts = await StockAlert.countDocuments({ status: 'active' });
      const lowStockAlerts = await StockAlert.countDocuments({
        type: 'low_stock',
        status: 'active',
      });
      const outOfStockAlerts = await StockAlert.countDocuments({
        type: 'out_of_stock',
        status: 'active',
      });
      const overstockAlerts = await StockAlert.countDocuments({
        type: 'overstock',
        status: 'active',
      });

      return {
        totalProducts: products.length,
        inStock,
        lowStock,
        outOfStock,
        totalValue,
        alerts: {
          active: activeAlerts,
          lowStock: lowStockAlerts,
          outOfStock: outOfStockAlerts,
          overstock: overstockAlerts,
        },
      };
    } catch (error) {
      logger.error('Error getting inventory status:', error);
      throw error;
    }
  }
}

