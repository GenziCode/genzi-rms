import { Types } from 'mongoose';
import { getTenantConnection } from '../config/database';
import { CustomerSchema, ICustomer } from '../models/customer.model';
import { SaleSchema, ISale } from '../models/sale.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export class CustomerService {
  private async getCustomerModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<ICustomer>('Customer', CustomerSchema);
  }

  async getCustomerStats(tenantId: string): Promise<any> {
    try {
      const Customer = await this.getCustomerModel(tenantId);
      const tenantObjectId = new Types.ObjectId(tenantId);

      const [summary] = await Customer.aggregate([
        { $match: { tenantId: tenantObjectId } },
        {
          $group: {
            _id: null,
            totalCustomers: { $sum: 1 },
            activeCustomers: {
              $sum: {
                $cond: ['$isActive', 1, 0],
              },
            },
            loyaltyMembers: {
              $sum: {
                $cond: [{ $gt: ['$loyaltyPoints', 0] }, 1, 0],
              },
            },
            totalLoyaltyPoints: { $sum: '$loyaltyPoints' },
            totalSpent: { $sum: '$totalSpent' },
            totalPurchases: { $sum: '$totalPurchases' },
            totalCreditBalance: { $sum: '$creditBalance' },
          },
        },
      ]);

      const stats = summary ?? {
        totalCustomers: 0,
        activeCustomers: 0,
        loyaltyMembers: 0,
        totalLoyaltyPoints: 0,
        totalSpent: 0,
        totalPurchases: 0,
        totalCreditBalance: 0,
      };

      const averageLifetimeValue =
        stats.totalCustomers > 0 ? stats.totalSpent / stats.totalCustomers : 0;
      const averageOrderValue =
        stats.totalPurchases > 0 ? stats.totalSpent / stats.totalPurchases : 0;

      const [recentCustomers, topCustomersRaw] = await Promise.all([
        Customer.find({ tenantId: tenantObjectId })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('name email phone loyaltyPoints totalSpent createdAt')
          .lean(),
        Customer.find({ tenantId: tenantObjectId })
          .sort({ totalSpent: -1 })
          .limit(5)
          .select('name email phone totalSpent totalPurchases loyaltyPoints')
          .lean(),
      ]);

      return {
        totalCustomers: stats.totalCustomers,
        activeCustomers: stats.activeCustomers,
        loyaltyMembers: stats.loyaltyMembers,
        totalLoyaltyPoints: stats.totalLoyaltyPoints,
        totalSpent: stats.totalSpent,
        totalPurchases: stats.totalPurchases,
        totalCreditBalance: stats.totalCreditBalance,
        averageLifetimeValue: Number(averageLifetimeValue.toFixed(2)),
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
        recentCustomers,
        topCustomers: topCustomersRaw.map((customer) => ({
          customer: {
            _id: customer._id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
          },
          totalSpent: customer.totalSpent ?? 0,
          totalOrders: customer.totalPurchases ?? 0,
          loyaltyPoints: customer.loyaltyPoints ?? 0,
        })),
      };
    } catch (error) {
      logger.error('Error getting customer stats:', error);
      throw error;
    }
  }

  private async getSaleModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<ISale>('Sale', SaleSchema);
  }

  /**
   * Create customer
   */
  async createCustomer(
    tenantId: string,
    userId: string,
    data: {
      name: string;
      email?: string;
      phone: string;
      address?: string;
      dateOfBirth?: Date;
      creditLimit?: number;
      notes?: string;
      tags?: string[];
    }
  ): Promise<ICustomer> {
    try {
      const Customer = await this.getCustomerModel(tenantId);

      // Check if phone already exists
      const existing = await Customer.findOne({ phone: data.phone });
      if (existing) {
        throw new AppError('Customer with this phone number already exists', 409);
      }

      // Check if email already exists (if provided)
      if (data.email) {
        const existingEmail = await Customer.findOne({ email: data.email });
        if (existingEmail) {
          throw new AppError('Customer with this email already exists', 409);
        }
      }

      const customer = new Customer({
        tenantId,
        ...data,
        createdBy: userId,
      });

      await customer.save();

      logger.info(`Customer created: ${customer.name} (${customer._id})`);
      return customer;
    } catch (error) {
      logger.error('Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Get all customers
   */
  async getCustomers(
    tenantId: string,
    options: {
      search?: string;
      loyaltyTier?: string;
      isActive?: boolean;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    customers: ICustomer[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const Customer = await this.getCustomerModel(tenantId);

      const {
        search,
        loyaltyTier,
        isActive = true,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 50,
      } = options;

      const query: any = {};

      if (isActive !== undefined) {
        query.isActive = isActive;
      }

      if (loyaltyTier) {
        query.loyaltyTier = loyaltyTier;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ];
      }

      const total = await Customer.countDocuments(query);

      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const customers = await Customer.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit);

      return {
        customers,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error getting customers:', error);
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(tenantId: string, customerId: string): Promise<ICustomer> {
    try {
      const Customer = await this.getCustomerModel(tenantId);

      const customer = await Customer.findById(customerId);

      if (!customer) {
        throw new AppError('Customer not found', 404);
      }

      return customer;
    } catch (error) {
      logger.error('Error getting customer:', error);
      throw error;
    }
  }

  /**
   * Update customer
   */
  async updateCustomer(
    tenantId: string,
    customerId: string,
    userId: string,
    data: Partial<ICustomer>
  ): Promise<ICustomer> {
    try {
      const Customer = await this.getCustomerModel(tenantId);

      const customer = await Customer.findById(customerId);
      if (!customer) {
        throw new AppError('Customer not found', 404);
      }

      // Check phone uniqueness
      if (data.phone && data.phone !== customer.phone) {
        const existing = await Customer.findOne({
          phone: data.phone,
          _id: { $ne: customerId },
        });
        if (existing) {
          throw new AppError('Phone number already exists', 409);
        }
      }

      // Check email uniqueness
      if (data.email && data.email !== customer.email) {
        const existing = await Customer.findOne({
          email: data.email,
          _id: { $ne: customerId },
        });
        if (existing) {
          throw new AppError('Email already exists', 409);
        }
      }

      Object.assign(customer, data, { updatedBy: userId });
      await customer.save();

      logger.info(`Customer updated: ${customer.name} (${customer._id})`);
      return customer;
    } catch (error) {
      logger.error('Error updating customer:', error);
      throw error;
    }
  }

  /**
   * Delete customer (soft delete)
   */
  async deleteCustomer(tenantId: string, customerId: string, userId: string): Promise<void> {
    try {
      const Customer = await this.getCustomerModel(tenantId);

      const customer = await Customer.findById(customerId);
      if (!customer) {
        throw new AppError('Customer not found', 404);
      }

      customer.isActive = false;
      customer.updatedBy = userId as any;
      await customer.save();

      logger.info(`Customer deleted: ${customer.name} (${customer._id})`);
    } catch (error) {
      logger.error('Error deleting customer:', error);
      throw error;
    }
  }

  /**
   * Get purchase history
   */
  async getPurchaseHistory(
    tenantId: string,
    customerId: string,
    page = 1,
    limit = 20
  ): Promise<{
    sales: ISale[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const Sale = await this.getSaleModel(tenantId);

      const total = await Sale.countDocuments({
        customer: customerId,
        status: 'completed',
      });

      const sales = await Sale.find({
        customer: customerId,
        status: 'completed',
      })
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit);

      return {
        sales,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error getting purchase history:', error);
      throw error;
    }
  }

  /**
   * Add/Redeem loyalty points
   */
  async adjustLoyaltyPoints(
    tenantId: string,
    customerId: string,
    userId: string,
    points: number,
    reason: string
  ): Promise<ICustomer> {
    try {
      const Customer = await this.getCustomerModel(tenantId);

      const customer = await Customer.findById(customerId);
      if (!customer) {
        throw new AppError('Customer not found', 404);
      }

      const newPoints = customer.loyaltyPoints + points;
      if (newPoints < 0) {
        throw new AppError('Insufficient loyalty points', 400);
      }

      customer.loyaltyPoints = newPoints;
      customer.updatedBy = userId as any;
      await customer.save();

      logger.info(
        `Loyalty points adjusted for ${customer.name}: ${points > 0 ? '+' : ''}${points} - ${reason}`
      );

      return customer;
    } catch (error) {
      logger.error('Error adjusting loyalty points:', error);
      throw error;
    }
  }

  /**
   * Update customer stats after purchase
   */
  async adjustCustomerCreditBalance(
    tenantId: string,
    customerId: string,
    delta: number
  ): Promise<ICustomer> {
    try {
      const Customer = await this.getCustomerModel(tenantId);

      const customer = await Customer.findById(customerId);
      if (!customer) {
        throw new AppError('Customer not found', 404);
      }

      const currentBalance = customer.creditBalance ?? 0;
      const creditLimit = customer.creditLimit ?? 0;
      const newBalance = currentBalance + delta;

      if (delta > 0) {
        const availableCredit = creditLimit - currentBalance;
        if (delta - availableCredit > 0.01) {
          throw new AppError(
            `Customer credit limit exceeded. Available credit: ${availableCredit.toFixed(2)}`,
            400
          );
        }
      }

      if (newBalance < -0.01) {
        throw new AppError('Customer credit balance cannot be negative', 400);
      }

      customer.creditBalance = Math.max(0, Math.round(newBalance * 100) / 100);
      await customer.save();

      logger.info(
        `Customer credit balance adjusted for ${customer.name}: ${
          delta >= 0 ? '+' : ''
        }${delta.toFixed(2)}`
      );

      return customer;
    } catch (error) {
      logger.error('Error adjusting customer credit balance:', error);
      throw error;
    }
  }

  /**
   * Update customer stats after purchase
   */
  async updateCustomerStats(
    tenantId: string,
    customerId: string,
    purchaseAmount: number
  ): Promise<void> {
    try {
      const Customer = await this.getCustomerModel(tenantId);

      const customer = await Customer.findById(customerId);
      if (!customer) return; // Customer might be optional

      customer.totalPurchases += 1;
      customer.totalSpent += purchaseAmount;
      customer.lastPurchase = new Date();

      // Award loyalty points (1 point per dollar)
      customer.loyaltyPoints += Math.floor(purchaseAmount);

      await customer.save();

      logger.info(`Customer stats updated: ${customer.name}`);
    } catch (error) {
      logger.error('Error updating customer stats:', error);
      // Don't throw - this is a background update
    }
  }
}
