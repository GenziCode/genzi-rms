import { getTenantConnection } from '../../config/database';
import { SaleSchema, ISale } from '../../models/sale.model';
import { ProductSchema, IProduct } from '../../models/product.model';
import { StoreSchema, IStore } from '../../models/store.model';
import { CustomerSchema, ICustomer } from '../../models/customer.model';
import { UserSchema, IUser } from '../../models/user.model';
import { logger } from '../../utils/logger';
import moment from 'moment-timezone';

export class SalesReportsService {
  private async getModels(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return {
      Sale: connection.model<ISale>('Sale', SaleSchema),
      Product: connection.model<IProduct>('Product', ProductSchema),
      Store: connection.model<IStore>('Store', StoreSchema),
      Customer: connection.model<ICustomer>('Customer', CustomerSchema),
      User: connection.model<IUser>('User', UserSchema),
    };
  }

  /**
   * Daily Sales Summary Report
   * Shows daily sales totals, transactions count, average transaction value
   */
  async getDailySalesSummary(
    tenantId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      storeId?: string;
    }
  ): Promise<any> {
    const { Sale, Store } = await this.getModels(tenantId);

    const startDate = filters.startDate || moment().startOf('day').toDate();
    const endDate = filters.endDate || moment().endOf('day').toDate();

    const matchStage: any = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['completed', 'paid'] },
    };

    if (filters.storeId) {
      matchStage.store = filters.storeId;
    }

    const dailyData = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          date: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } },
          totalSales: { $sum: '$total' },
          totalTransactions: { $sum: 1 },
          totalItems: { $sum: { $sum: '$items.quantity' } },
          totalTax: { $sum: '$tax' },
          totalDiscount: { $sum: '$discount' },
          totalCost: { $sum: '$cost' },
          avgTransactionValue: { $avg: '$total' },
        },
      },
      { $sort: { date: 1 } },
    ]);

    const summary = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalTransactions: { $sum: 1 },
          totalItems: { $sum: { $sum: '$items.quantity' } },
          totalTax: { $sum: '$tax' },
          totalDiscount: { $sum: '$discount' },
          totalCost: { $sum: '$cost' },
          avgTransactionValue: { $avg: '$total' },
        },
      },
    ]);

    return {
      dailyData,
      summary: summary[0] || {
        totalSales: 0,
        totalTransactions: 0,
        totalItems: 0,
        totalTax: 0,
        totalDiscount: 0,
        totalCost: 0,
        avgTransactionValue: 0,
      },
      dateRange: { startDate, endDate },
    };
  }

  /**
   * Weekly Sales Report
   * Weekly aggregated sales report
   */
  async getWeeklySales(
    tenantId: string,
    filters: {
      weekStart?: Date;
      weekEnd?: Date;
      storeId?: string;
    }
  ): Promise<any> {
    const { Sale } = await this.getModels(tenantId);

    const weekStart = filters.weekStart || moment().startOf('week').toDate();
    const weekEnd = filters.weekEnd || moment().endOf('week').toDate();

    const matchStage: any = {
      createdAt: { $gte: weekStart, $lte: weekEnd },
      status: { $in: ['completed', 'paid'] },
    };

    if (filters.storeId) {
      matchStage.store = filters.storeId;
    }

    const weeklyData = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-W%V', date: '$createdAt' },
          },
          week: { $first: { $dateToString: { format: '%Y-W%V', date: '$createdAt' } } },
          totalSales: { $sum: '$total' },
          totalTransactions: { $sum: 1 },
          totalItems: { $sum: { $sum: '$items.quantity' } },
          totalTax: { $sum: '$tax' },
          totalDiscount: { $sum: '$discount' },
          avgTransactionValue: { $avg: '$total' },
        },
      },
      { $sort: { week: 1 } },
    ]);

    // Get previous week for comparison
    const prevWeekStart = moment(weekStart).subtract(7, 'days').toDate();
    const prevWeekEnd = moment(weekEnd).subtract(7, 'days').toDate();

    const prevWeekMatch = { ...matchStage, createdAt: { $gte: prevWeekStart, $lte: prevWeekEnd } };
    const prevWeekData = await Sale.aggregate([
      { $match: prevWeekMatch },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);

    const currentSummary = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalTransactions: { $sum: 1 },
          totalItems: { $sum: { $sum: '$items.quantity' } },
          totalTax: { $sum: '$tax' },
          totalDiscount: { $sum: '$discount' },
          avgTransactionValue: { $avg: '$total' },
        },
      },
    ]);

    const current = currentSummary[0] || { totalSales: 0, totalTransactions: 0 };
    const previous = prevWeekData[0] || { totalSales: 0, totalTransactions: 0 };

    return {
      weeklyData,
      summary: current,
      comparison: {
        previousWeek: previous,
        salesChange: current.totalSales - previous.totalSales,
        salesChangePercent:
          previous.totalSales > 0
            ? ((current.totalSales - previous.totalSales) / previous.totalSales) * 100
            : 0,
        transactionsChange: current.totalTransactions - previous.totalTransactions,
        transactionsChangePercent:
          previous.totalTransactions > 0
            ? ((current.totalTransactions - previous.totalTransactions) / previous.totalTransactions) * 100
            : 0,
      },
      dateRange: { weekStart, weekEnd },
    };
  }

  /**
   * Monthly Sales Report
   * Monthly aggregated sales report
   */
  async getMonthlySales(
    tenantId: string,
    filters: {
      month?: number;
      year?: number;
      storeId?: string;
    }
  ): Promise<any> {
    const { Sale } = await this.getModels(tenantId);

    const year = filters.year || moment().year();
    const month = filters.month || moment().month() + 1;

    const monthStart = moment(`${year}-${month}`, 'YYYY-M').startOf('month').toDate();
    const monthEnd = moment(`${year}-${month}`, 'YYYY-M').endOf('month').toDate();

    const matchStage: any = {
      createdAt: { $gte: monthStart, $lte: monthEnd },
      status: { $in: ['completed', 'paid'] },
    };

    if (filters.storeId) {
      matchStage.store = filters.storeId;
    }

    const dailyData = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          date: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } },
          totalSales: { $sum: '$total' },
          totalTransactions: { $sum: 1 },
          totalItems: { $sum: { $sum: '$items.quantity' } },
          avgTransactionValue: { $avg: '$total' },
        },
      },
      { $sort: { date: 1 } },
    ]);

    const summary = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalTransactions: { $sum: 1 },
          totalItems: { $sum: { $sum: '$items.quantity' } },
          totalTax: { $sum: '$tax' },
          totalDiscount: { $sum: '$discount' },
          avgTransactionValue: { $avg: '$total' },
        },
      },
    ]);

    // Year-over-year comparison
    const prevYearStart = moment(`${year - 1}-${month}`, 'YYYY-M').startOf('month').toDate();
    const prevYearEnd = moment(`${year - 1}-${month}`, 'YYYY-M').endOf('month').toDate();

    const prevYearMatch = { ...matchStage, createdAt: { $gte: prevYearStart, $lte: prevYearEnd } };
    const prevYearData = await Sale.aggregate([
      { $match: prevYearMatch },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);

    const current = summary[0] || { totalSales: 0, totalTransactions: 0 };
    const previous = prevYearData[0] || { totalSales: 0, totalTransactions: 0 };

    return {
      dailyData,
      summary: current,
      comparison: {
        previousYear: previous,
        salesChange: current.totalSales - previous.totalSales,
        salesChangePercent:
          previous.totalSales > 0 ? ((current.totalSales - previous.totalSales) / previous.totalSales) * 100 : 0,
        transactionsChange: current.totalTransactions - previous.totalTransactions,
        transactionsChangePercent:
          previous.totalTransactions > 0
            ? ((current.totalTransactions - previous.totalTransactions) / previous.totalTransactions) * 100
            : 0,
      },
      month: { year, month },
    };
  }

  /**
   * Sales by Product Report
   * Report showing sales breakdown by product
   */
  async getSalesByProduct(
    tenantId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      productId?: string;
      storeId?: string;
    }
  ): Promise<any> {
    const { Sale, Product } = await this.getModels(tenantId);

    const startDate = filters.startDate || moment().subtract(30, 'days').startOf('day').toDate();
    const endDate = filters.endDate || moment().endOf('day').toDate();

    const matchStage: any = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['completed', 'paid'] },
    };

    if (filters.storeId) {
      matchStage.store = filters.storeId;
    }

    const productSales = await Sale.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      ...(filters.productId ? [{ $match: { 'items.product': filters.productId } }] : []),
      {
        $group: {
          _id: '$items.product',
          productId: { $first: '$items.product' },
          productName: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          totalCost: { $sum: { $multiply: ['$items.quantity', '$items.cost'] } },
          avgUnitPrice: { $avg: '$items.price' },
          transactionCount: { $addToSet: '$_id' },
        },
      },
      {
        $project: {
          _id: 1,
          productId: 1,
          productName: 1,
          totalQuantity: 1,
          totalRevenue: 1,
          totalCost: 1,
          avgUnitPrice: 1,
          transactionCount: { $size: '$transactionCount' },
          profit: { $subtract: ['$totalRevenue', '$totalCost'] },
          profitMargin: {
            $cond: [
              { $gt: ['$totalRevenue', 0] },
              { $multiply: [{ $divide: [{ $subtract: ['$totalRevenue', '$totalCost'] }, '$totalRevenue'] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    // Populate product details
    const productIds = productSales.map((p) => p.productId).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } }).lean();

    const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));

    const enrichedData = productSales.map((item) => ({
      ...item,
      product: productMap.get(item.productId?.toString() || ''),
    }));

    return {
      products: enrichedData,
      summary: {
        totalProducts: enrichedData.length,
        totalQuantity: enrichedData.reduce((sum, p) => sum + p.totalQuantity, 0),
        totalRevenue: enrichedData.reduce((sum, p) => sum + p.totalRevenue, 0),
        totalCost: enrichedData.reduce((sum, p) => sum + p.totalCost, 0),
        totalProfit: enrichedData.reduce((sum, p) => sum + p.profit, 0),
      },
      dateRange: { startDate, endDate },
    };
  }

  /**
   * Sales by Category Report
   * Report showing sales breakdown by category
   */
  async getSalesByCategory(
    tenantId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      categoryId?: string;
      storeId?: string;
    }
  ): Promise<any> {
    const { Sale, Product } = await this.getModels(tenantId);

    const startDate = filters.startDate || moment().subtract(30, 'days').startOf('day').toDate();
    const endDate = filters.endDate || moment().endOf('day').toDate();

    const matchStage: any = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['completed', 'paid'] },
    };

    if (filters.storeId) {
      matchStage.store = filters.storeId;
    }

    // First, get all products with their categories
    const products = await Product.find({}).select('_id category').lean();
    const productCategoryMap = new Map(
      products.map((p: any) => [p._id.toString(), p.category?.toString() || 'Uncategorized'])
    );

    // Get all sales with items
    const salesWithItems = await Sale.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $project: {
          productId: '$items.product',
          quantity: '$items.quantity',
          price: '$items.price',
          cost: '$items.cost',
        },
      },
    ]);

    // Map products to categories and aggregate
    const categoryMap = new Map<string, any>();

    salesWithItems.forEach((sale: any) => {
      const productId = sale.productId?.toString() || '';
      const categoryId = productCategoryMap.get(productId) || 'Uncategorized';

      if (filters.categoryId && categoryId !== filters.categoryId) {
        return;
      }

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName: categoryId,
          totalQuantity: 0,
          totalRevenue: 0,
          totalCost: 0,
          productSet: new Set<string>(),
        });
      }

      const category = categoryMap.get(categoryId)!;
      category.totalQuantity += sale.quantity;
      category.totalRevenue += sale.quantity * sale.price;
      category.totalCost += sale.quantity * sale.cost;
      if (sale.productId) {
        category.productSet.add(sale.productId.toString());
      }
    });

    const categorySales = Array.from(categoryMap.values()).map((cat) => ({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      totalQuantity: cat.totalQuantity,
      totalRevenue: cat.totalRevenue,
      totalCost: cat.totalCost,
      productCount: cat.productSet.size,
      profit: cat.totalRevenue - cat.totalCost,
      profitMargin: cat.totalRevenue > 0 ? ((cat.totalRevenue - cat.totalCost) / cat.totalRevenue) * 100 : 0,
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      categories: categorySales,
      summary: {
        totalCategories: categorySales.length,
        totalQuantity: categorySales.reduce((sum, c) => sum + c.totalQuantity, 0),
        totalRevenue: categorySales.reduce((sum, c) => sum + c.totalRevenue, 0),
        totalCost: categorySales.reduce((sum, c) => sum + c.totalCost, 0),
        totalProfit: categorySales.reduce((sum, c) => sum + c.profit, 0),
      },
      dateRange: { startDate, endDate },
    };
  }

  /**
   * Sales by Store Report
   * Report comparing sales across stores
   */
  async getSalesByStore(
    tenantId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      storeIds?: string[];
    }
  ): Promise<any> {
    const { Sale, Store } = await this.getModels(tenantId);

    const startDate = filters.startDate || moment().subtract(30, 'days').startOf('day').toDate();
    const endDate = filters.endDate || moment().endOf('day').toDate();

    const matchStage: any = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['completed', 'paid'] },
    };

    if (filters.storeIds && filters.storeIds.length > 0) {
      matchStage.store = { $in: filters.storeIds };
    }

    const storeSales = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$store',
          storeId: { $first: '$store' },
          totalSales: { $sum: '$total' },
          totalTransactions: { $sum: 1 },
          totalItems: { $sum: { $sum: '$items.quantity' } },
          totalTax: { $sum: '$tax' },
          totalDiscount: { $sum: '$discount' },
          avgTransactionValue: { $avg: '$total' },
        },
      },
      { $sort: { totalSales: -1 } },
    ]);

    // Populate store details
    const storeIds = storeSales.map((s) => s.storeId).filter(Boolean);
    const stores = await Store.find({ _id: { $in: storeIds } }).lean();

    const storeMap = new Map(stores.map((s: any) => [s._id.toString(), s]));

    const enrichedData = storeSales.map((item) => ({
      ...item,
      store: storeMap.get(item.storeId?.toString() || ''),
    }));

    return {
      stores: enrichedData,
      summary: {
        totalStores: enrichedData.length,
        totalSales: enrichedData.reduce((sum, s) => sum + s.totalSales, 0),
        totalTransactions: enrichedData.reduce((sum, s) => sum + s.totalTransactions, 0),
        totalItems: enrichedData.reduce((sum, s) => sum + s.totalItems, 0),
      },
      dateRange: { startDate, endDate },
    };
  }

  /**
   * Sales by Employee/Cashier Report
   * Report showing sales performance by employee
   */
  async getSalesByEmployee(
    tenantId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      employeeId?: string;
      storeId?: string;
    }
  ): Promise<any> {
    const { Sale, User } = await this.getModels(tenantId);

    const startDate = filters.startDate || moment().subtract(30, 'days').startOf('day').toDate();
    const endDate = filters.endDate || moment().endOf('day').toDate();

    const matchStage: any = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['completed', 'paid'] },
    };

    if (filters.storeId) {
      matchStage.store = filters.storeId;
    }

    if (filters.employeeId) {
      matchStage.cashier = filters.employeeId;
    }

    const employeeSales = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$cashier',
          employeeId: { $first: '$cashier' },
          totalSales: { $sum: '$total' },
          totalTransactions: { $sum: 1 },
          totalItems: { $sum: { $sum: '$items.quantity' } },
          avgTransactionValue: { $avg: '$total' },
          totalDiscount: { $sum: '$discount' },
        },
      },
      {
        $project: {
          _id: 1,
          employeeId: 1,
          totalSales: 1,
          totalTransactions: 1,
          totalItems: 1,
          avgTransactionValue: { $round: ['$avgTransactionValue', 2] },
          totalDiscount: 1,
          itemsPerTransaction: { $divide: ['$totalItems', { $max: ['$totalTransactions', 1] }] },
        },
      },
      { $sort: { totalSales: -1 } },
    ]);

    // Populate employee details
    const employeeIds = employeeSales.map((e) => e.employeeId).filter(Boolean);
    const employees = await User.find({ _id: { $in: employeeIds } }).select('firstName lastName email').lean();

    const employeeMap = new Map(employees.map((e: any) => [e._id.toString(), e]));

    const enrichedData = employeeSales.map((item) => ({
      ...item,
      employee: employeeMap.get(item.employeeId?.toString() || ''),
    }));

    return {
      employees: enrichedData,
      summary: {
        totalEmployees: enrichedData.length,
        totalSales: enrichedData.reduce((sum, e) => sum + e.totalSales, 0),
        totalTransactions: enrichedData.reduce((sum, e) => sum + e.totalTransactions, 0),
        avgSalesPerEmployee:
          enrichedData.length > 0
            ? enrichedData.reduce((sum, e) => sum + e.totalSales, 0) / enrichedData.length
            : 0,
      },
      dateRange: { startDate, endDate },
    };
  }

  /**
   * Sales by Customer Report
   * Report showing sales breakdown by customer
   */
  async getSalesByCustomer(
    tenantId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      customerId?: string;
      storeId?: string;
      limit?: number;
    }
  ): Promise<any> {
    const { Sale, Customer } = await this.getModels(tenantId);

    const startDate = filters.startDate || moment().subtract(30, 'days').startOf('day').toDate();
    const endDate = filters.endDate || moment().endOf('day').toDate();

    const matchStage: any = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['completed', 'paid'] },
    };

    if (filters.storeId) {
      matchStage.store = filters.storeId;
    }

    if (filters.customerId) {
      matchStage.customer = filters.customerId;
    }

    const customerSales = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$customer',
          customerId: { $first: '$customer' },
          totalSales: { $sum: '$total' },
          totalTransactions: { $sum: 1 },
          totalItems: { $sum: { $sum: '$items.quantity' } },
          avgTransactionValue: { $avg: '$total' },
          lastPurchaseDate: { $max: '$createdAt' },
          firstPurchaseDate: { $min: '$createdAt' },
        },
      },
      {
        $project: {
          _id: 1,
          customerId: 1,
          totalSales: 1,
          totalTransactions: 1,
          totalItems: 1,
          avgTransactionValue: { $round: ['$avgTransactionValue', 2] },
          lastPurchaseDate: 1,
          firstPurchaseDate: 1,
          daysSinceLastPurchase: {
            $divide: [{ $subtract: [new Date(), '$lastPurchaseDate'] }, 86400000],
          },
        },
      },
      { $sort: { totalSales: -1 } },
      ...(filters.limit ? [{ $limit: filters.limit }] : []),
    ]);

    // Populate customer details
    const customerIds = customerSales.map((c) => c.customerId).filter(Boolean);
    const customers = await Customer.find({ _id: { $in: customerIds } })
      .select('firstName lastName email phone customerNumber')
      .lean();

    const customerMap = new Map(customers.map((c: any) => [c._id.toString(), c]));

    const enrichedData = customerSales.map((item) => ({
      ...item,
      customer: customerMap.get(item.customerId?.toString() || ''),
    }));

    return {
      customers: enrichedData,
      summary: {
        totalCustomers: enrichedData.length,
        totalSales: enrichedData.reduce((sum, c) => sum + c.totalSales, 0),
        totalTransactions: enrichedData.reduce((sum, c) => sum + c.totalTransactions, 0),
        avgSalesPerCustomer:
          enrichedData.length > 0 ? enrichedData.reduce((sum, c) => sum + c.totalSales, 0) / enrichedData.length : 0,
      },
      dateRange: { startDate, endDate },
    };
  }

  /**
   * Sales Comparison Report
   * Period-over-period sales comparison
   */
  async getSalesComparison(
    tenantId: string,
    filters: {
      period1Start: Date;
      period1End: Date;
      period2Start: Date;
      period2End: Date;
      storeId?: string;
    }
  ): Promise<any> {
    const { Sale } = await this.getModels(tenantId);

    const matchStage1: any = {
      createdAt: { $gte: filters.period1Start, $lte: filters.period1End },
      status: { $in: ['completed', 'paid'] },
    };

    const matchStage2: any = {
      createdAt: { $gte: filters.period2Start, $lte: filters.period2End },
      status: { $in: ['completed', 'paid'] },
    };

    if (filters.storeId) {
      matchStage1.store = filters.storeId;
      matchStage2.store = filters.storeId;
    }

    const [period1Data, period2Data] = await Promise.all([
      Sale.aggregate([
        { $match: matchStage1 },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$total' },
            totalTransactions: { $sum: 1 },
            totalItems: { $sum: { $sum: '$items.quantity' } },
            totalTax: { $sum: '$tax' },
            totalDiscount: { $sum: '$discount' },
            avgTransactionValue: { $avg: '$total' },
          },
        },
      ]),
      Sale.aggregate([
        { $match: matchStage2 },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$total' },
            totalTransactions: { $sum: 1 },
            totalItems: { $sum: { $sum: '$items.quantity' } },
            totalTax: { $sum: '$tax' },
            totalDiscount: { $sum: '$discount' },
            avgTransactionValue: { $avg: '$total' },
          },
        },
      ]),
    ]);

    const period1 = period1Data[0] || {
      totalSales: 0,
      totalTransactions: 0,
      totalItems: 0,
      totalTax: 0,
      totalDiscount: 0,
      avgTransactionValue: 0,
    };

    const period2 = period2Data[0] || {
      totalSales: 0,
      totalTransactions: 0,
      totalItems: 0,
      totalTax: 0,
      totalDiscount: 0,
      avgTransactionValue: 0,
    };

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      period1: {
        ...period1,
        dateRange: { start: filters.period1Start, end: filters.period1End },
      },
      period2: {
        ...period2,
        dateRange: { start: filters.period2Start, end: filters.period2End },
      },
      comparison: {
        salesChange: period1.totalSales - period2.totalSales,
        salesChangePercent: calculateChange(period1.totalSales, period2.totalSales),
        transactionsChange: period1.totalTransactions - period2.totalTransactions,
        transactionsChangePercent: calculateChange(period1.totalTransactions, period2.totalTransactions),
        itemsChange: period1.totalItems - period2.totalItems,
        itemsChangePercent: calculateChange(period1.totalItems, period2.totalItems),
        avgTransactionChange: period1.avgTransactionValue - period2.avgTransactionValue,
        avgTransactionChangePercent: calculateChange(period1.avgTransactionValue, period2.avgTransactionValue),
      },
    };
  }

  /**
   * Top Selling Products Report
   * Report showing top N selling products
   */
  async getTopSellingProducts(
    tenantId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      sortBy?: 'revenue' | 'quantity' | 'transactions';
      storeId?: string;
    }
  ): Promise<any> {
    const { Sale, Product } = await this.getModels(tenantId);

    const startDate = filters.startDate || moment().subtract(30, 'days').startOf('day').toDate();
    const endDate = filters.endDate || moment().endOf('day').toDate();
    const limit = filters.limit || 10;
    const sortBy = filters.sortBy || 'revenue';

    const matchStage: any = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['completed', 'paid'] },
    };

    if (filters.storeId) {
      matchStage.store = filters.storeId;
    }

    const sortField =
      sortBy === 'quantity'
        ? 'totalQuantity'
        : sortBy === 'transactions'
          ? 'transactionCount'
          : 'totalRevenue';

    const productSales = await Sale.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          productId: { $first: '$items.product' },
          productName: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          avgUnitPrice: { $avg: '$items.price' },
          transactionCount: { $addToSet: '$_id' },
        },
      },
      {
        $project: {
          _id: 1,
          productId: 1,
          productName: 1,
          totalQuantity: 1,
          totalRevenue: 1,
          avgUnitPrice: { $round: ['$avgUnitPrice', 2] },
          transactionCount: { $size: '$transactionCount' },
        },
      },
      { $sort: { [sortField]: -1 } },
      { $limit: limit },
    ]);

    // Populate product details
    const productIds = productSales.map((p) => p.productId).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } }).lean();

    const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));

    const enrichedData = productSales.map((item, index) => ({
      ...item,
      rank: index + 1,
      product: productMap.get(item.productId?.toString() || ''),
    }));

    return {
      products: enrichedData,
      summary: {
        totalProducts: enrichedData.length,
        totalQuantity: enrichedData.reduce((sum, p) => sum + p.totalQuantity, 0),
        totalRevenue: enrichedData.reduce((sum, p) => sum + p.totalRevenue, 0),
      },
      dateRange: { startDate, endDate },
      filters: { limit, sortBy },
    };
  }

  /**
   * Bottom Selling Products Report
   * Report showing worst performing products
   */
  async getBottomSellingProducts(
    tenantId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      sortBy?: 'revenue' | 'quantity' | 'transactions';
      storeId?: string;
    }
  ): Promise<any> {
    const { Sale, Product } = await this.getModels(tenantId);

    const startDate = filters.startDate || moment().subtract(30, 'days').startOf('day').toDate();
    const endDate = filters.endDate || moment().endOf('day').toDate();
    const limit = filters.limit || 10;
    const sortBy = filters.sortBy || 'revenue';

    const matchStage: any = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['completed', 'paid'] },
    };

    if (filters.storeId) {
      matchStage.store = filters.storeId;
    }

    const sortField =
      sortBy === 'quantity'
        ? 'totalQuantity'
        : sortBy === 'transactions'
          ? 'transactionCount'
          : 'totalRevenue';

    const productSales = await Sale.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          productId: { $first: '$items.product' },
          productName: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          avgUnitPrice: { $avg: '$items.price' },
          transactionCount: { $addToSet: '$_id' },
        },
      },
      {
        $project: {
          _id: 1,
          productId: 1,
          productName: 1,
          totalQuantity: 1,
          totalRevenue: 1,
          avgUnitPrice: { $round: ['$avgUnitPrice', 2] },
          transactionCount: { $size: '$transactionCount' },
        },
      },
      { $sort: { [sortField]: 1 } }, // Ascending for bottom products
      { $limit: limit },
    ]);

    // Populate product details
    const productIds = productSales.map((p) => p.productId).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } }).lean();

    const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));

    const enrichedData = productSales.map((item, index) => ({
      ...item,
      rank: index + 1,
      product: productMap.get(item.productId?.toString() || ''),
    }));

    return {
      products: enrichedData,
      summary: {
        totalProducts: enrichedData.length,
        totalQuantity: enrichedData.reduce((sum, p) => sum + p.totalQuantity, 0),
        totalRevenue: enrichedData.reduce((sum, p) => sum + p.totalRevenue, 0),
      },
      dateRange: { startDate, endDate },
      filters: { limit, sortBy },
    };
  }

  /**
   * Sales Trend Analysis Report
   * Analyze sales trends over time
   */
  async getSalesTrendAnalysis(
    tenantId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      period?: 'day' | 'week' | 'month';
      storeId?: string;
    }
  ): Promise<any> {
    const { Sale } = await this.getModels(tenantId);

    const startDate = filters.startDate || moment().subtract(90, 'days').startOf('day').toDate();
    const endDate = filters.endDate || moment().endOf('day').toDate();
    const period = filters.period || 'day';

    const matchStage: any = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['completed', 'paid'] },
    };

    if (filters.storeId) {
      matchStage.store = filters.storeId;
    }

    const dateFormat =
      period === 'day' ? '%Y-%m-%d' : period === 'week' ? '%Y-W%V' : '%Y-%m';

    const trendData = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: '$createdAt' },
          },
          period: { $first: { $dateToString: { format: dateFormat, date: '$createdAt' } } },
          totalSales: { $sum: '$total' },
          totalTransactions: { $sum: 1 },
          totalItems: { $sum: { $sum: '$items.quantity' } },
          avgTransactionValue: { $avg: '$total' },
        },
      },
      { $sort: { period: 1 } },
    ]);

    // Calculate trend metrics
    const trends = trendData.map((item, index) => {
      const previous = index > 0 ? trendData[index - 1] : null;
      return {
        ...item,
        salesChange: previous ? item.totalSales - previous.totalSales : 0,
        salesChangePercent: previous && previous.totalSales > 0
          ? ((item.totalSales - previous.totalSales) / previous.totalSales) * 100
          : 0,
        transactionsChange: previous ? item.totalTransactions - previous.totalTransactions : 0,
        transactionsChangePercent: previous && previous.totalTransactions > 0
          ? ((item.totalTransactions - previous.totalTransactions) / previous.totalTransactions) * 100
          : 0,
      };
    });

    return {
      trends,
      summary: {
        totalPeriods: trends.length,
        averageSales: trends.length > 0
          ? trends.reduce((sum, t) => sum + t.totalSales, 0) / trends.length
          : 0,
        averageTransactions: trends.length > 0
          ? trends.reduce((sum, t) => sum + t.totalTransactions, 0) / trends.length
          : 0,
        totalSales: trends.reduce((sum, t) => sum + t.totalSales, 0),
        totalTransactions: trends.reduce((sum, t) => sum + t.totalTransactions, 0),
      },
      dateRange: { startDate, endDate },
      period,
    };
  }

  /**
   * Discount Analysis Report
   * Analyze discount usage and impact
   */
  async getDiscountAnalysis(
    tenantId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      storeId?: string;
    }
  ): Promise<any> {
    const { Sale } = await this.getModels(tenantId);

    const startDate = filters.startDate || moment().subtract(30, 'days').startOf('day').toDate();
    const endDate = filters.endDate || moment().endOf('day').toDate();

    const matchStage: any = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['completed', 'paid'] },
      discount: { $gt: 0 },
    };

    if (filters.storeId) {
      matchStage.store = filters.storeId;
    }

    const discountData = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalDiscountAmount: { $sum: '$discount' },
          totalSales: { $sum: '$total' },
          avgDiscountAmount: { $avg: '$discount' },
          avgDiscountPercent: {
            $avg: {
              $cond: [
                { $gt: ['$subtotal', 0] },
                { $multiply: [{ $divide: ['$discount', '$subtotal'] }, 100] },
                0,
              ],
            },
          },
        },
      },
    ]);

    const allSales = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['completed', 'paid'] },
          ...(filters.storeId && { store: filters.storeId }),
        },
      },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalSales: { $sum: '$total' },
        },
      },
    ]);

    const discount = discountData[0] || {
      totalTransactions: 0,
      totalDiscountAmount: 0,
      totalSales: 0,
      avgDiscountAmount: 0,
      avgDiscountPercent: 0,
    };

    const all = allSales[0] || { totalTransactions: 0, totalSales: 0 };

    return {
      discount: {
        ...discount,
        discountRate: all.totalTransactions > 0
          ? (discount.totalTransactions / all.totalTransactions) * 100
          : 0,
      },
      allSales: all,
      impact: {
        discountPercentage: all.totalSales > 0
          ? (discount.totalDiscountAmount / all.totalSales) * 100
          : 0,
        potentialSalesWithoutDiscount: all.totalSales + discount.totalDiscountAmount,
      },
      dateRange: { startDate, endDate },
    };
  }

  /**
   * Return/Refund Report
   * Track returns and refunds
   */
  async getReturnRefundReport(
    tenantId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      storeId?: string;
    }
  ): Promise<any> {
    const { Sale } = await this.getModels(tenantId);

    const startDate = filters.startDate || moment().subtract(30, 'days').startOf('day').toDate();
    const endDate = filters.endDate || moment().endOf('day').toDate();

    const matchStage: any = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['refunded', 'returned', 'cancelled'] },
    };

    if (filters.storeId) {
      matchStage.store = filters.storeId;
    }

    const returns = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total' },
          totalItems: { $sum: { $sum: '$items.quantity' } },
        },
      },
    ]);

    const dailyReturns = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          date: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } },
          count: { $sum: 1 },
          totalAmount: { $sum: '$total' },
        },
      },
      { $sort: { date: 1 } },
    ]);

    return {
      summary: {
        totalReturns: returns.reduce((sum, r) => sum + r.count, 0),
        totalRefundAmount: returns.reduce((sum, r) => sum + r.totalAmount, 0),
        totalItemsReturned: returns.reduce((sum, r) => sum + r.totalItems, 0),
        byStatus: returns,
      },
      dailyReturns,
      dateRange: { startDate, endDate },
    };
  }

  /**
   * Sales Forecast Report
   * Predict future sales based on historical data
   */
  async getSalesForecast(
    tenantId: string,
    filters: {
      forecastDays?: number;
      storeId?: string;
    }
  ): Promise<any> {
    const { Sale } = await this.getModels(tenantId);

    const forecastDays = filters.forecastDays || 30;
    const historicalDays = forecastDays * 2; // Use 2x historical data for forecast

    const startDate = moment().subtract(historicalDays, 'days').startOf('day').toDate();
    const endDate = moment().endOf('day').toDate();

    const matchStage: any = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['completed', 'paid'] },
    };

    if (filters.storeId) {
      matchStage.store = filters.storeId;
    }

    const historicalData = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          date: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } },
          totalSales: { $sum: '$total' },
          totalTransactions: { $sum: 1 },
        },
      },
      { $sort: { date: 1 } },
    ]);

    // Simple moving average forecast
    const windowSize = 7; // 7-day moving average
    const recentData = historicalData.slice(-windowSize);
    const avgDailySales =
      recentData.length > 0
        ? recentData.reduce((sum, d) => sum + d.totalSales, 0) / recentData.length
        : 0;
    const avgDailyTransactions =
      recentData.length > 0
        ? recentData.reduce((sum, d) => sum + d.totalTransactions, 0) / recentData.length
        : 0;

    const forecast = [];
    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = moment().add(i, 'days').format('YYYY-MM-DD');
      forecast.push({
        date: forecastDate,
        forecastedSales: avgDailySales,
        forecastedTransactions: Math.round(avgDailyTransactions),
        confidence: Math.max(0, 100 - i * 2), // Decreasing confidence over time
      });
    }

    return {
      historical: historicalData,
      forecast,
      summary: {
        historicalAverage: avgDailySales,
        forecastedTotal: avgDailySales * forecastDays,
        forecastedTransactions: Math.round(avgDailyTransactions * forecastDays),
        confidence: 85, // Overall confidence percentage
      },
      forecastDays,
    };
  }
}

export const salesReportsService = new SalesReportsService();
