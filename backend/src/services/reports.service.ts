import { getTenantConnection } from '../config/database';
import { SaleSchema, ISale } from '../models/sale.model';
import { ProductSchema, IProduct } from '../models/product.model';
import { CustomerSchema, ICustomer } from '../models/customer.model';
import { VendorSchema, IVendor } from '../models/vendor.model';
import { StockMovementSchema } from '../models/inventory.model';
import { logger } from '../utils/logger';
import moment from 'moment-timezone';

export class ReportsService {
  private async getModels(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return {
      Sale: connection.model<ISale>('Sale', SaleSchema),
      Product: connection.model<IProduct>('Product', ProductSchema),
      Customer: connection.model<ICustomer>('Customer', CustomerSchema),
      Vendor: connection.model<IVendor>('Vendor', VendorSchema),
      StockMovement: connection.model('StockMovement', StockMovementSchema),
    };
  }

  /**
   * Dashboard KPIs
   */
  async getDashboard(tenantId: string, period: 'today' | 'week' | 'month' = 'today'): Promise<any> {
    try {
      const { Sale, Product, Customer, Vendor } = await this.getModels(tenantId);

      // Date range
      const now = moment();
      let startDate: Date;

      switch (period) {
        case 'today':
          startDate = now.startOf('day').toDate();
          break;
        case 'week':
          startDate = now.startOf('week').toDate();
          break;
        case 'month':
          startDate = now.startOf('month').toDate();
          break;
      }

      // Sales stats
      const salesData = await Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $in: ['completed', 'paid'] },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$total' },
            totalTransactions: { $sum: 1 },
            totalItems: { $sum: { $sum: '$items.quantity' } },
            totalTax: { $sum: '$tax' },
            totalDiscount: { $sum: '$discount' },
          },
        },
      ]);

      const sales = salesData[0] || {
        totalSales: 0,
        totalTransactions: 0,
        totalItems: 0,
        totalTax: 0,
        totalDiscount: 0,
      };

      // Product stats
      const totalProducts = await Product.countDocuments({ isActive: true });
      const lowStockProducts = await Product.countDocuments({
        isActive: true,
        trackInventory: true,
        stock: { $lte: 10 },
      });
      const outOfStockProducts = await Product.countDocuments({
        isActive: true,
        trackInventory: true,
        stock: { $lte: 0 },
      });

      // Customer stats
      const totalCustomers = await Customer.countDocuments({ isActive: true });
      const newCustomersCount = await Customer.countDocuments({
        isActive: true,
        createdAt: { $gte: startDate },
      });

      // Average order value
      const avgOrderValue =
        sales.totalTransactions > 0 ? sales.totalSales / sales.totalTransactions : 0;

      return {
        period,
        dateRange: {
          start: startDate,
          end: now.toDate(),
        },
        sales: {
          total: sales.totalSales,
          transactions: sales.totalTransactions,
          items: sales.totalItems,
          tax: sales.totalTax,
          discount: sales.totalDiscount,
          avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        },
        products: {
          total: totalProducts,
          lowStock: lowStockProducts,
          outOfStock: outOfStockProducts,
        },
        customers: {
          total: totalCustomers,
          new: newCustomersCount,
        },
      };
    } catch (error) {
      logger.error('Error getting dashboard:', error);
      throw error;
    }
  }

  /**
   * Sales trends (daily breakdown)
   */
  async getSalesTrends(tenantId: string, startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const { Sale } = await this.getModels(tenantId);

      const trends = await Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $in: ['completed', 'paid'] },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
            },
            totalSales: { $sum: '$total' },
            transactions: { $sum: 1 },
            avgOrderValue: { $avg: '$total' },
          },
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
        },
      ]);

      return trends.map((t) => ({
        date: `${t._id.year}-${String(t._id.month).padStart(2, '0')}-${String(t._id.day).padStart(2, '0')}`,
        totalSales: Math.round(t.totalSales * 100) / 100,
        transactions: t.transactions,
        avgOrderValue: Math.round(t.avgOrderValue * 100) / 100,
      }));
    } catch (error) {
      logger.error('Error getting sales trends:', error);
      throw error;
    }
  }

  /**
   * Top selling products
   */
  async getTopProducts(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<any[]> {
    try {
      const { Sale } = await this.getModels(tenantId);

      const topProducts = await Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $in: ['completed', 'paid'] },
          },
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            productName: { $first: '$items.productName' },
            totalQuantity: { $sum: '$items.quantity' },
            totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
            avgPrice: { $avg: '$items.price' },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: limit },
      ]);

      return topProducts.map((p) => ({
        productId: p._id,
        productName: p.productName,
        quantitySold: p.totalQuantity,
        revenue: Math.round(p.totalRevenue * 100) / 100,
        avgPrice: Math.round(p.avgPrice * 100) / 100,
      }));
    } catch (error) {
      logger.error('Error getting top products:', error);
      throw error;
    }
  }

  /**
   * Payment methods analysis
   */
  async getPaymentMethodsReport(tenantId: string, startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const { Sale } = await this.getModels(tenantId);

      const paymentMethods = await Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $in: ['completed', 'paid'] },
          },
        },
        { $unwind: '$payments' },
        {
          $group: {
            _id: '$payments.method',
            totalAmount: { $sum: '$payments.amount' },
            transactions: { $sum: 1 },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]);

      return paymentMethods.map((pm) => ({
        method: pm._id,
        totalAmount: Math.round(pm.totalAmount * 100) / 100,
        transactions: pm.transactions,
      }));
    } catch (error) {
      logger.error('Error getting payment methods report:', error);
      throw error;
    }
  }

  /**
   * Profit & Loss report
   */
  async getProfitLoss(tenantId: string, startDate: Date, endDate: Date): Promise<any> {
    try {
      const { Sale, Product } = await this.getModels(tenantId);

      // Sales revenue
      const salesData = await Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $in: ['completed', 'paid'] },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            totalTax: { $sum: '$tax' },
            totalDiscount: { $sum: '$discount' },
          },
        },
      ]);

      const sales = salesData[0] || {
        totalRevenue: 0,
        totalTax: 0,
        totalDiscount: 0,
      };

      // Calculate cost of goods sold (using current cost price)
      const soldItems = await Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $in: ['completed', 'paid'] },
          },
        },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: null,
            cogs: {
              $sum: {
                $multiply: ['$items.quantity', { $ifNull: ['$productInfo.costPrice', 0] }],
              },
            },
          },
        },
      ]);

      const cogs = soldItems[0]?.cogs || 0;

      const grossProfit = sales.totalRevenue - cogs;
      const netProfit = grossProfit - sales.totalDiscount;
      const profitMargin = sales.totalRevenue > 0 ? (netProfit / sales.totalRevenue) * 100 : 0;

      return {
        period: { start: startDate, end: endDate },
        revenue: {
          gross: Math.round(sales.totalRevenue * 100) / 100,
          tax: Math.round(sales.totalTax * 100) / 100,
          net: Math.round((sales.totalRevenue - sales.totalTax) * 100) / 100,
        },
        costs: {
          cogs: Math.round(cogs * 100) / 100,
          discounts: Math.round(sales.totalDiscount * 100) / 100,
        },
        profit: {
          gross: Math.round(grossProfit * 100) / 100,
          net: Math.round(netProfit * 100) / 100,
          margin: Math.round(profitMargin * 100) / 100,
        },
      };
    } catch (error) {
      logger.error('Error getting profit & loss:', error);
      throw error;
    }
  }

  /**
   * Inventory valuation trends
   */
  async getInventoryValuation(tenantId: string): Promise<any> {
    try {
      const { Product } = await this.getModels(tenantId);

      const valuation = await Product.aggregate([
        {
          $match: { isActive: true },
        },
        {
          $group: {
            _id: null,
            totalItems: { $sum: '$stock' },
            costValue: { $sum: { $multiply: ['$stock', '$costPrice'] } },
            retailValue: { $sum: { $multiply: ['$stock', '$price'] } },
            totalProducts: { $sum: 1 },
          },
        },
      ]);

      const val = valuation[0] || {
        totalItems: 0,
        costValue: 0,
        retailValue: 0,
        totalProducts: 0,
      };

      const potentialProfit = val.retailValue - val.costValue;

      return {
        totalProducts: val.totalProducts,
        totalItems: val.totalItems,
        costValue: Math.round(val.costValue * 100) / 100,
        retailValue: Math.round(val.retailValue * 100) / 100,
        potentialProfit: Math.round(potentialProfit * 100) / 100,
      };
    } catch (error) {
      logger.error('Error getting inventory valuation:', error);
      throw error;
    }
  }

  /**
   * Customer insights
   */
  async getCustomerInsights(tenantId: string, startDate: Date, endDate: Date): Promise<any> {
    try {
      const { Sale, Customer } = await this.getModels(tenantId);

      const topCustomers = await Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $in: ['completed', 'paid'] },
            customer: { $exists: true },
          },
        },
        {
          $group: {
            _id: '$customer',
            totalSpent: { $sum: '$total' },
            visits: { $sum: 1 },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'customers',
            localField: '_id',
            foreignField: '_id',
            as: 'customerInfo',
          },
        },
        { $unwind: { path: '$customerInfo', preserveNullAndEmptyArrays: true } },
      ]);

      const customers = topCustomers.map((c) => ({
        customerId: c._id,
        customerName: c.customerInfo?.name || c.customerInfo?.fullName || 'Guest',
        email: c.customerInfo?.email,
        totalSpent: Math.round(c.totalSpent * 100) / 100,
        visits: c.visits,
        avgOrderValue:
          c.visits > 0 ? Math.round((c.totalSpent / c.visits) * 100) / 100 : 0,
      }));

      const totalCustomers = await Customer.countDocuments({ isActive: true });
      const newCustomers = await Customer.countDocuments({
        isActive: true,
        createdAt: { $gte: startDate, $lte: endDate },
      });

      return {
        period: { start: startDate, end: endDate },
        totalCustomers,
        newCustomers,
        topCustomers: customers,
      };
    } catch (error) {
      logger.error('Error getting customer insights:', error);
      throw error;
    }
  }

  /**
   * Vendor performance
   */
  async getVendorPerformance(tenantId: string, startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const { Vendor } = await this.getModels(tenantId);

      const vendors = await Vendor.find({ isActive: true })
        .select('name email phone stats')
        .sort('-stats.totalPurchased')
        .limit(10);

      return vendors.map((v) => ({
        vendorId: v._id,
        name: v.name,
        email: v.email,
        phone: v.phone,
        totalOrders: v.stats?.totalOrders || 0,
        totalPurchased: v.stats?.totalPurchased || 0,
        avgOrderValue:
          v.stats && v.stats.totalOrders > 0
            ? Math.round((v.stats.totalPurchased / v.stats.totalOrders) * 100) / 100
            : 0,
      }));
    } catch (error) {
      logger.error('Error getting vendor performance:', error);
      throw error;
    }
  }
}
