import { Connection } from 'mongoose';
import { getTenantConnection } from '../config/database';
import { SaleSchema, ISale, ISaleItem, IPayment } from '../models/sale.model';
import { ProductSchema, IProduct } from '../models/product.model';
import { CustomerService } from './customer.service';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

interface CartItem {
  productId: string;
  quantity: number;
  price?: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
}

interface CreateSaleData {
  storeId: string;
  customerId?: string;
  items: CartItem[];
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  payments: IPayment[];
  notes?: string;
}

export class POSService {
  private customerService: CustomerService;

  constructor() {
    this.customerService = new CustomerService();
  }

  private async getSaleModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<ISale>('Sale', SaleSchema);
  }

  private async getProductModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<IProduct>('Product', ProductSchema);
  }

  /**
   * Calculate item totals with discount and tax
   */
  private calculateItemTotal(
    quantity: number,
    price: number,
    discount: number,
    discountType: 'percentage' | 'fixed',
    taxRate: number
  ): { subtotal: number; tax: number; total: number } {
    const subtotal = quantity * price;

    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (subtotal * discount) / 100;
    } else {
      discountAmount = discount;
    }

    const afterDiscount = subtotal - discountAmount;
    const tax = (afterDiscount * taxRate) / 100;
    const total = afterDiscount + tax;

    return {
      subtotal,
      tax,
      total,
    };
  }

  /**
   * Create a sale transaction
   */
  async createSale(tenantId: string, userId: string, data: CreateSaleData): Promise<ISale> {
    try {
      const Sale = await this.getSaleModel(tenantId);
      const Product = await this.getProductModel(tenantId);

      // Validate and fetch products
      const saleItems: ISaleItem[] = [];
      let subtotal = 0;
      let totalTax = 0;

      for (const item of data.items) {
        const product = await Product.findById(item.productId);
        if (!product) {
          throw new AppError(`Product not found: ${item.productId}`, 404);
        }

        if (!product.isActive) {
          throw new AppError(`Product is not active: ${product.name}`, 400);
        }

        // Check stock if inventory tracking is enabled
        if (product.trackInventory) {
          if ((product.stock || 0) < item.quantity) {
            throw new AppError(
              `Insufficient stock for ${product.name}. Available: ${product.stock}`,
              400
            );
          }
        }

        const price = item.price || product.price;
        const discount = item.discount || 0;
        const discountType = item.discountType || 'fixed';
        const taxRate = product.taxRate || 0;

        const itemTotals = this.calculateItemTotal(
          item.quantity,
          price,
          discount,
          discountType,
          taxRate
        );

        saleItems.push({
          product: product._id,
          name: product.name,
          sku: product.sku,
          quantity: item.quantity,
          price,
          cost: product.cost || 0,
          discount,
          discountType,
          tax: itemTotals.tax,
          taxRate,
          subtotal: itemTotals.subtotal,
          total: itemTotals.total,
        });

        subtotal += itemTotals.subtotal;
        totalTax += itemTotals.tax;
      }

      // Apply overall discount
      let overallDiscount = 0;
      if (data.discount) {
        if (data.discountType === 'percentage') {
          overallDiscount = (subtotal * data.discount) / 100;
        } else {
          overallDiscount = data.discount;
        }
      }

      const afterDiscount = subtotal - overallDiscount;
      const total = afterDiscount + totalTax;

      // Calculate payments
      const amountPaid = data.payments.reduce((sum, p) => sum + p.amount, 0);
      const change = Math.max(0, amountPaid - total);

      if (amountPaid < total) {
        throw new AppError(
          `Insufficient payment. Required: ${total}, Received: ${amountPaid}`,
          400
        );
      }

      // Create sale
      const sale = new Sale({
        tenantId,
        store: data.storeId,
        cashier: userId,
        customer: data.customerId,
        items: saleItems,
        subtotal,
        discount: overallDiscount,
        discountType: data.discountType || 'fixed',
        tax: totalTax,
        total,
        payments: data.payments,
        amountPaid,
        change,
        status: 'completed',
        notes: data.notes,
        createdBy: userId,
      });

      await sale.save();

      // Update product stock
      for (const item of saleItems) {
        const product = await Product.findById(item.product);
        if (product && product.trackInventory) {
          product.stock = (product.stock || 0) - item.quantity;
          await product.save();
        }
      }

      // Update customer stats if customer is provided
      if (data.customerId) {
        await this.customerService.updateCustomerStats(tenantId, data.customerId, total);
      }

      logger.info(`Sale created: ${sale.saleNumber} - Total: ${total}`);
      return sale;
    } catch (error) {
      logger.error('Error creating sale:', error);
      throw error;
    }
  }

  /**
   * Hold a transaction for later completion
   */
  async holdTransaction(
    tenantId: string,
    userId: string,
    data: Omit<CreateSaleData, 'payments'>
  ): Promise<ISale> {
    try {
      const Sale = await this.getSaleModel(tenantId);
      const Product = await this.getProductModel(tenantId);

      // Similar to createSale but without payments
      const saleItems: ISaleItem[] = [];
      let subtotal = 0;
      let totalTax = 0;

      for (const item of data.items) {
        const product = await Product.findById(item.productId);
        if (!product) {
          throw new AppError(`Product not found: ${item.productId}`, 404);
        }

        const price = item.price || product.price;
        const discount = item.discount || 0;
        const discountType = item.discountType || 'fixed';
        const taxRate = product.taxRate || 0;

        const itemTotals = this.calculateItemTotal(
          item.quantity,
          price,
          discount,
          discountType,
          taxRate
        );

        saleItems.push({
          product: product._id,
          name: product.name,
          sku: product.sku,
          quantity: item.quantity,
          price,
          cost: product.cost || 0,
          discount,
          discountType,
          tax: itemTotals.tax,
          taxRate,
          subtotal: itemTotals.subtotal,
          total: itemTotals.total,
        });

        subtotal += itemTotals.subtotal;
        totalTax += itemTotals.tax;
      }

      let overallDiscount = 0;
      if (data.discount) {
        if (data.discountType === 'percentage') {
          overallDiscount = (subtotal * data.discount) / 100;
        } else {
          overallDiscount = data.discount;
        }
      }

      const afterDiscount = subtotal - overallDiscount;
      const total = afterDiscount + totalTax;

      const sale = new Sale({
        tenantId,
        store: data.storeId,
        cashier: userId,
        customer: data.customerId,
        items: saleItems,
        subtotal,
        discount: overallDiscount,
        discountType: data.discountType || 'fixed',
        tax: totalTax,
        total,
        payments: [],
        amountPaid: 0,
        change: 0,
        status: 'held',
        notes: data.notes,
        heldAt: new Date(),
        heldBy: userId as any,
        createdBy: userId,
      });

      await sale.save();

      logger.info(`Transaction held: ${sale.saleNumber}`);
      return sale;
    } catch (error) {
      logger.error('Error holding transaction:', error);
      throw error;
    }
  }

  /**
   * Resume a held transaction
   */
  async resumeTransaction(tenantId: string, saleId: string, payments: IPayment[]): Promise<ISale> {
    try {
      const Sale = await this.getSaleModel(tenantId);
      const Product = await this.getProductModel(tenantId);

      const sale = await Sale.findById(saleId);
      if (!sale) {
        throw new AppError('Sale not found', 404);
      }

      if (sale.status !== 'held') {
        throw new AppError('Sale is not in held status', 400);
      }

      // Check stock availability
      for (const item of sale.items) {
        const product = await Product.findById(item.product);
        if (product && product.trackInventory) {
          if ((product.stock || 0) < item.quantity) {
            throw new AppError(
              `Insufficient stock for ${product.name}. Available: ${product.stock}`,
              400
            );
          }
        }
      }

      const amountPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const change = Math.max(0, amountPaid - sale.total);

      if (amountPaid < sale.total) {
        throw new AppError(
          `Insufficient payment. Required: ${sale.total}, Received: ${amountPaid}`,
          400
        );
      }

      // Update sale
      sale.payments = payments;
      sale.amountPaid = amountPaid;
      sale.change = change;
      sale.status = 'completed';
      sale.heldAt = undefined;
      sale.heldBy = undefined;

      await sale.save();

      // Update product stock
      for (const item of sale.items) {
        const product = await Product.findById(item.product);
        if (product && product.trackInventory) {
          product.stock = (product.stock || 0) - item.quantity;
          await product.save();
        }
      }

      logger.info(`Transaction resumed and completed: ${sale.saleNumber}`);
      return sale;
    } catch (error) {
      logger.error('Error resuming transaction:', error);
      throw error;
    }
  }

  /**
   * Get all held transactions
   */
  async getHeldTransactions(tenantId: string): Promise<ISale[]> {
    try {
      const Sale = await this.getSaleModel(tenantId);

      const sales = await Sale.find({
        status: 'held',
      })
        .sort('-heldAt')
        .populate('customer', 'name phone email');

      return sales;
    } catch (error) {
      logger.error('Error getting held transactions:', error);
      throw error;
    }
  }

  /**
   * Get all sales with filters
   */
  async getSales(
    tenantId: string,
    options: {
      storeId?: string;
      cashierId?: string;
      customerId?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    sales: ISale[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const Sale = await this.getSaleModel(tenantId);

      const {
        storeId,
        cashierId,
        customerId,
        status,
        startDate,
        endDate,
        page = 1,
        limit = 50,
      } = options;

      const query: any = {};

      if (storeId) query.store = storeId;
      if (cashierId) query.cashier = cashierId;
      if (customerId) query.customer = customerId;
      if (status) query.status = status;

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = startDate;
        if (endDate) query.createdAt.$lte = endDate;
      }

      const total = await Sale.countDocuments(query);

      const sales = await Sale.find(query)
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('customer', 'name phone email');

      return {
        sales,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error getting sales:', error);
      throw error;
    }
  }

  /**
   * Get sale by ID
   */
  async getSaleById(tenantId: string, saleId: string): Promise<ISale> {
    try {
      const Sale = await this.getSaleModel(tenantId);

      const sale = await Sale.findById(saleId).populate('customer', 'name phone email');

      if (!sale) {
        throw new AppError('Sale not found', 404);
      }

      return sale;
    } catch (error) {
      logger.error('Error getting sale:', error);
      throw error;
    }
  }

  /**
   * Void a sale
   */
  async voidSale(tenantId: string, saleId: string, userId: string, reason: string): Promise<ISale> {
    try {
      const Sale = await this.getSaleModel(tenantId);
      const Product = await this.getProductModel(tenantId);

      const sale = await Sale.findById(saleId);
      if (!sale) {
        throw new AppError('Sale not found', 404);
      }

      if (sale.status === 'voided') {
        throw new AppError('Sale is already voided', 400);
      }

      if (sale.status === 'refunded') {
        throw new AppError('Cannot void a refunded sale', 400);
      }

      // Restore stock
      for (const item of sale.items) {
        const product = await Product.findById(item.product);
        if (product && product.trackInventory) {
          product.stock = (product.stock || 0) + item.quantity;
          await product.save();
        }
      }

      sale.status = 'voided';
      sale.voidedAt = new Date();
      sale.voidedBy = userId as any;
      sale.voidReason = reason;
      sale.updatedBy = userId as any;

      await sale.save();

      logger.info(`Sale voided: ${sale.saleNumber} - Reason: ${reason}`);
      return sale;
    } catch (error) {
      logger.error('Error voiding sale:', error);
      throw error;
    }
  }

  /**
   * Refund a sale (full or partial)
   */
  async refundSale(
    tenantId: string,
    saleId: string,
    userId: string,
    amount: number,
    reason: string
  ): Promise<ISale> {
    try {
      const Sale = await this.getSaleModel(tenantId);
      const Product = await this.getProductModel(tenantId);

      const sale = await Sale.findById(saleId);
      if (!sale) {
        throw new AppError('Sale not found', 404);
      }

      if (sale.status === 'voided') {
        throw new AppError('Cannot refund a voided sale', 400);
      }

      if (amount > sale.total) {
        throw new AppError('Refund amount exceeds sale total', 400);
      }

      // Full refund - restore all stock
      if (amount === sale.total) {
        for (const item of sale.items) {
          const product = await Product.findById(item.product);
          if (product && product.trackInventory) {
            product.stock = (product.stock || 0) + item.quantity;
            await product.save();
          }
        }
        sale.status = 'refunded';
      } else {
        sale.status = 'partial_refund';
      }

      sale.refundedAt = new Date();
      sale.refundedBy = userId as any;
      sale.refundAmount = amount;
      sale.refundReason = reason;
      sale.updatedBy = userId as any;

      await sale.save();

      logger.info(`Sale refunded: ${sale.saleNumber} - Amount: ${amount} - Reason: ${reason}`);
      return sale;
    } catch (error) {
      logger.error('Error refunding sale:', error);
      throw error;
    }
  }

  /**
   * Get daily sales summary
   */
  async getDailySummary(tenantId: string, storeId?: string, date?: Date): Promise<any> {
    try {
      const Sale = await this.getSaleModel(tenantId);

      const targetDate = date || new Date();
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const query: any = {
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: 'completed',
      };

      if (storeId) {
        query.store = storeId;
      }

      const sales = await Sale.find(query);

      const summary = {
        date: targetDate,
        totalSales: sales.length,
        totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
        totalDiscount: sales.reduce((sum, sale) => sum + sale.discount, 0),
        totalTax: sales.reduce((sum, sale) => sum + sale.tax, 0),
        averageTransaction:
          sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length : 0,
        paymentMethods: {} as Record<string, { count: number; amount: number }>,
      };

      // Calculate payment methods breakdown
      sales.forEach((sale) => {
        sale.payments.forEach((payment) => {
          if (!summary.paymentMethods[payment.method]) {
            summary.paymentMethods[payment.method] = { count: 0, amount: 0 };
          }
          summary.paymentMethods[payment.method].count++;
          summary.paymentMethods[payment.method].amount += payment.amount;
        });
      });

      return summary;
    } catch (error) {
      logger.error('Error getting daily summary:', error);
      throw error;
    }
  }
}
