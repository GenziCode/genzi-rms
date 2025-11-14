import { getTenantConnection } from '../../config/database';
import { ProductSchema, IProduct } from '../../models/product.model';
import { StoreSchema, IStore } from '../../models/store.model';
import { PurchaseOrderSchema, IPurchaseOrder } from '../../models/purchaseOrder.model';
import { SaleSchema, ISale } from '../../models/sale.model';
import { logger } from '../../utils/logger';
import moment from 'moment-timezone';

export class InventoryReportsService {
  private async getModels(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return {
      Product: connection.model<IProduct>('Product', ProductSchema),
      Store: connection.model<IStore>('Store', StoreSchema),
      PurchaseOrder: connection.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema),
      Sale: connection.model<ISale>('Sale', SaleSchema),
    };
  }

  /**
   * Current Stock Status Report
   * Shows current inventory levels for all products
   */
  async getCurrentStockStatus(
    tenantId: string,
    filters: {
      storeId?: string;
      categoryId?: string;
      lowStockOnly?: boolean;
      outOfStockOnly?: boolean;
    }
  ) {
    const { Product, Store } = await this.getModels(tenantId);

    const matchStage: any = {
      isActive: true,
      trackInventory: true,
    };

    if (filters.categoryId) {
      matchStage.category = filters.categoryId;
    }

    const products = await Product.find(matchStage)
      .populate('category', 'name')
      .lean();

    let filteredProducts = products;

    if (filters.lowStockOnly) {
      filteredProducts = products.filter(
        (p: any) => p.minStock && p.stock !== undefined && p.stock <= p.minStock
      );
    }

    if (filters.outOfStockOnly) {
      filteredProducts = products.filter((p: any) => p.stock === 0 || p.stock === undefined);
    }

    const summary = {
      totalProducts: filteredProducts.length,
      totalQuantity: filteredProducts.reduce((sum, p: any) => sum + (p.stock || 0), 0),
      lowStockCount: filteredProducts.filter(
        (p: any) => p.minStock && p.stock !== undefined && p.stock <= p.minStock
      ).length,
      outOfStockCount: filteredProducts.filter((p: any) => p.stock === 0 || p.stock === undefined)
        .length,
      totalValue: filteredProducts.reduce(
        (sum, p: any) => sum + (p.stock || 0) * (p.cost || 0),
        0
      ),
    };

    return {
      products: filteredProducts.map((p: any) => ({
        productId: p._id,
        productName: p.name,
        sku: p.sku,
        category: p.category?.name || 'Uncategorized',
        currentStock: p.stock || 0,
        minStock: p.minStock || 0,
        maxStock: p.maxStock || 0,
        reorderPoint: p.reorderPoint || 0,
        unitCost: p.cost || 0,
        totalValue: (p.stock || 0) * (p.cost || 0),
        status:
          p.stock === 0 || p.stock === undefined
            ? 'out_of_stock'
            : p.minStock && p.stock <= p.minStock
              ? 'low_stock'
              : 'in_stock',
      })),
      summary,
    };
  }

  /**
   * Low Stock Alert Report
   * Products below reorder point
   */
  async getLowStockAlert(
    tenantId: string,
    filters: {
      storeId?: string;
      categoryId?: string;
    }
  ) {
    const { Product } = await this.getModels(tenantId);

    const matchStage: any = {
      isActive: true,
      trackInventory: true,
      $or: [
        { stock: { $lte: '$minStock' } },
        { stock: { $lte: '$reorderPoint' } },
        { stock: 0 },
        { stock: { $exists: false } },
      ],
    };

    if (filters.categoryId) {
      matchStage.category = filters.categoryId;
    }

    const products = await Product.find(matchStage)
      .populate('category', 'name')
      .lean();

    // Filter in memory for complex conditions
    const lowStockProducts = products.filter((p: any) => {
      const stock = p.stock || 0;
      const reorderPoint = p.reorderPoint || p.minStock || 0;
      return stock <= reorderPoint || stock === 0;
    });

    return {
      products: lowStockProducts.map((p: any) => ({
        productId: p._id,
        productName: p.name,
        sku: p.sku,
        category: p.category?.name || 'Uncategorized',
        currentStock: p.stock || 0,
        reorderPoint: p.reorderPoint || p.minStock || 0,
        reorderQuantity: p.reorderQuantity || 0,
        unitCost: p.cost || 0,
        daysOutOfStock: 0, // Can be calculated from last sale date
        urgency: p.stock === 0 ? 'critical' : p.stock <= (p.reorderPoint || 0) * 0.5 ? 'high' : 'medium',
      })),
      summary: {
        totalLowStock: lowStockProducts.length,
        critical: lowStockProducts.filter((p: any) => (p.stock || 0) === 0).length,
        high: lowStockProducts.filter(
          (p: any) => (p.stock || 0) > 0 && (p.stock || 0) <= ((p.reorderPoint || p.minStock || 0) * 0.5)
        ).length,
        medium: lowStockProducts.filter(
          (p: any) =>
            (p.stock || 0) > (p.reorderPoint || p.minStock || 0) * 0.5 &&
            (p.stock || 0) <= (p.reorderPoint || p.minStock || 0)
        ).length,
      },
    };
  }

  /**
   * Overstock Report
   * Products exceeding maximum stock levels
   */
  async getOverstockReport(
    tenantId: string,
    filters: {
      storeId?: string;
      categoryId?: string;
    }
  ) {
    const { Product } = await this.getModels(tenantId);

    const matchStage: any = {
      isActive: true,
      trackInventory: true,
      maxStock: { $exists: true, $gt: 0 },
    };

    if (filters.categoryId) {
      matchStage.category = filters.categoryId;
    }

    const products = await Product.find(matchStage)
      .populate('category', 'name')
      .lean();

    const overstockProducts = products.filter((p: any) => {
      const stock = p.stock || 0;
      const maxStock = p.maxStock || 0;
      return stock > maxStock;
    });

    return {
      products: overstockProducts.map((p: any) => ({
        productId: p._id,
        productName: p.name,
        sku: p.sku,
        category: p.category?.name || 'Uncategorized',
        currentStock: p.stock || 0,
        maxStock: p.maxStock || 0,
        excessStock: (p.stock || 0) - (p.maxStock || 0),
        unitCost: p.cost || 0,
        excessValue: ((p.stock || 0) - (p.maxStock || 0)) * (p.cost || 0),
        excessPercentage: ((p.stock || 0) / (p.maxStock || 0) - 1) * 100,
      })),
      summary: {
        totalOverstock: overstockProducts.length,
        totalExcessQuantity: overstockProducts.reduce(
          (sum, p: any) => sum + ((p.stock || 0) - (p.maxStock || 0)),
          0
        ),
        totalExcessValue: overstockProducts.reduce(
          (sum, p: any) => sum + ((p.stock || 0) - (p.maxStock || 0)) * (p.cost || 0),
          0
        ),
      },
    };
  }

  /**
   * Stock Movement Report
   * Track stock movements (in/out) over time
   */
  async getStockMovement(
    tenantId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      productId?: string;
      storeId?: string;
      movementType?: 'in' | 'out' | 'adjustment';
    }
  ) {
    const { Product, PurchaseOrder, Sale } = await this.getModels(tenantId);

    const startDate = filters.startDate || moment().subtract(30, 'days').startOf('day').toDate();
    const endDate = filters.endDate || moment().endOf('day').toDate();

    const movements: any[] = [];

    // Get purchase orders (stock in)
    if (!filters.movementType || filters.movementType === 'in') {
      const poMatch: any = {
        status: { $in: ['received', 'completed'] },
        receivedAt: { $gte: startDate, $lte: endDate },
      };

      if (filters.storeId) {
        poMatch.store = filters.storeId;
      }

      const purchaseOrders = await PurchaseOrder.find(poMatch)
        .populate('items.product', 'name sku')
        .lean();

      purchaseOrders.forEach((po: any) => {
        po.items.forEach((item: any) => {
          if (!filters.productId || item.product?._id?.toString() === filters.productId) {
            movements.push({
              date: po.receivedAt || po.createdAt,
              type: 'in',
              reference: po.poNumber,
              productId: item.product?._id,
              productName: item.product?.name || 'Unknown',
              quantity: item.quantityReceived || item.quantity,
              unitCost: item.unitCost || 0,
              totalCost: (item.quantityReceived || item.quantity) * (item.unitCost || 0),
            });
          }
        });
      });
    }

    // Get sales (stock out)
    if (!filters.movementType || filters.movementType === 'out') {
      const saleMatch: any = {
        status: { $in: ['completed', 'paid'] },
        createdAt: { $gte: startDate, $lte: endDate },
      };

      if (filters.storeId) {
        saleMatch.store = filters.storeId;
      }

      const sales = await Sale.find(saleMatch)
        .populate('items.product', 'name sku')
        .lean();

      sales.forEach((sale: any) => {
        sale.items.forEach((item: any) => {
          if (!filters.productId || item.product?.toString() === filters.productId) {
            movements.push({
              date: sale.createdAt,
              type: 'out',
              reference: sale.saleNumber || sale._id.toString(),
              productId: item.product,
              productName: item.name || 'Unknown',
              quantity: item.quantity,
              unitPrice: item.price || 0,
              totalValue: item.quantity * (item.price || 0),
            });
          }
        });
      });
    }

    // Sort by date
    movements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const summary = {
      totalMovements: movements.length,
      stockIn: movements.filter((m) => m.type === 'in').reduce((sum, m) => sum + m.quantity, 0),
      stockOut: movements.filter((m) => m.type === 'out').reduce((sum, m) => sum + m.quantity, 0),
      netMovement:
        movements.filter((m) => m.type === 'in').reduce((sum, m) => sum + m.quantity, 0) -
        movements.filter((m) => m.type === 'out').reduce((sum, m) => sum + m.quantity, 0),
    };

    return {
      movements,
      summary,
      dateRange: { startDate, endDate },
    };
  }

  /**
   * Stock Valuation Report
   * Current inventory value by product/category
   */
  async getStockValuation(
    tenantId: string,
    filters: {
      storeId?: string;
      categoryId?: string;
      valuationMethod?: 'fifo' | 'average' | 'lifo';
    }
  ) {
    const { Product } = await this.getModels(tenantId);

    const matchStage: any = {
      isActive: true,
      trackInventory: true,
    };

    if (filters.categoryId) {
      matchStage.category = filters.categoryId;
    }

    const products = await Product.find(matchStage)
      .populate('category', 'name')
      .lean();

    const valuation = products.map((p: any) => {
      const stock = p.stock || 0;
      const cost = p.cost || 0;
      const price = p.price || 0;

      return {
        productId: p._id,
        productName: p.name,
        sku: p.sku,
        category: p.category?.name || 'Uncategorized',
        quantity: stock,
        unitCost: cost,
        totalCost: stock * cost,
        unitPrice: price,
        totalValue: stock * price,
        profitPotential: stock * (price - cost),
        profitMargin: price > 0 ? ((price - cost) / price) * 100 : 0,
      };
    });

    const summary = {
      totalProducts: valuation.length,
      totalQuantity: valuation.reduce((sum, v) => sum + v.quantity, 0),
      totalCostValue: valuation.reduce((sum, v) => sum + v.totalCost, 0),
      totalRetailValue: valuation.reduce((sum, v) => sum + v.totalValue, 0),
      totalProfitPotential: valuation.reduce((sum, v) => sum + v.profitPotential, 0),
      averageProfitMargin:
        valuation.length > 0
          ? valuation.reduce((sum, v) => sum + v.profitMargin, 0) / valuation.length
          : 0,
    };

    return {
      valuation,
      summary,
    };
  }
}

export const inventoryReportsService = new InventoryReportsService();

