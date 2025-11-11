import { getTenantConnection } from '../config/database';
import { VendorSchema, IVendor } from '../models/vendor.model';
import { PurchaseOrderSchema } from '../models/purchaseOrder.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export class VendorService {
  private async getVendorModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<IVendor>('Vendor', VendorSchema);
  }

  /**
   * Create vendor
   */
  async createVendor(
    tenantId: string,
    userId: string,
    data: {
      name: string;
      company: string;
      email?: string;
      phone: string;
      address?: string;
      city?: string;
      country?: string;
      taxId?: string;
      contactPerson?: string;
      contactPhone?: string;
      contactEmail?: string;
      paymentTerms?: string;
      creditLimit?: number;
      creditDays?: number;
      products?: string[];
      notes?: string;
      tags?: string[];
    }
  ): Promise<IVendor> {
    try {
      const Vendor = await this.getVendorModel(tenantId);

      // Check if phone already exists
      const existingPhone = await Vendor.findOne({ phone: data.phone });
      if (existingPhone) {
        throw new AppError('Vendor with this phone number already exists', 409);
      }

      // Check if email already exists (if provided)
      if (data.email) {
        const existingEmail = await Vendor.findOne({ email: data.email });
        if (existingEmail) {
          throw new AppError('Vendor with this email already exists', 409);
        }
      }

      const vendor = new Vendor({
        tenantId,
        ...data,
        createdBy: userId,
      });

      await vendor.save();

      logger.info(`Vendor created: ${vendor.company} (${vendor._id})`);
      return vendor;
    } catch (error) {
      logger.error('Error creating vendor:', error);
      throw error;
    }
  }

  /**
   * Get all vendors
   */
  async getVendors(
    tenantId: string,
    options: {
      search?: string;
      isActive?: boolean;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    vendors: IVendor[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const Vendor = await this.getVendorModel(tenantId);

      const {
        search,
        isActive = true,
        sortBy = 'company',
        sortOrder = 'asc',
        page = 1,
        limit = 50,
      } = options;

      const query: any = {};

      if (isActive !== undefined) {
        query.isActive = isActive;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ];
      }

      const total = await Vendor.countDocuments(query);

      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const vendors = await Vendor.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit);

      return {
        vendors,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error getting vendors:', error);
      throw error;
    }
  }

  /**
   * Get vendor by ID
   */
  async getVendorById(tenantId: string, vendorId: string): Promise<IVendor> {
    try {
      const Vendor = await this.getVendorModel(tenantId);

      const vendor = await Vendor.findById(vendorId);

      if (!vendor) {
        throw new AppError('Vendor not found', 404);
      }

      return vendor;
    } catch (error) {
      logger.error('Error getting vendor:', error);
      throw error;
    }
  }

  /**
   * Update vendor
   */
  async updateVendor(
    tenantId: string,
    vendorId: string,
    userId: string,
    data: Partial<IVendor>
  ): Promise<IVendor> {
    try {
      const Vendor = await this.getVendorModel(tenantId);

      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        throw new AppError('Vendor not found', 404);
      }

      // Check phone uniqueness
      if (data.phone && data.phone !== vendor.phone) {
        const existing = await Vendor.findOne({
          phone: data.phone,
          _id: { $ne: vendorId },
        });
        if (existing) {
          throw new AppError('Phone number already exists', 409);
        }
      }

      // Check email uniqueness
      if (data.email && data.email !== vendor.email) {
        const existing = await Vendor.findOne({
          email: data.email,
          _id: { $ne: vendorId },
        });
        if (existing) {
          throw new AppError('Email already exists', 409);
        }
      }

      Object.assign(vendor, data, { updatedBy: userId });
      await vendor.save();

      logger.info(`Vendor updated: ${vendor.company} (${vendor._id})`);
      return vendor;
    } catch (error) {
      logger.error('Error updating vendor:', error);
      throw error;
    }
  }

  /**
   * Delete vendor (soft delete)
   */
  async deleteVendor(
    tenantId: string,
    vendorId: string,
    userId: string
  ): Promise<void> {
    try {
      const Vendor = await this.getVendorModel(tenantId);

      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        throw new AppError('Vendor not found', 404);
      }

      // Check if vendor has active POs
      const connection = await getTenantConnection(tenantId);
      const PO = connection.model('PurchaseOrder', PurchaseOrderSchema);
      const activePOs = await PO.countDocuments({
        vendor: vendorId,
        status: { $in: ['draft', 'sent', 'confirmed', 'partially_received'] },
      });

      if (activePOs > 0) {
        throw new AppError(
          `Cannot delete vendor. It has ${activePOs} active purchase order(s).`,
          409
        );
      }

      vendor.isActive = false;
      vendor.updatedBy = userId as any;
      await vendor.save();

      logger.info(`Vendor deleted: ${vendor.company} (${vendor._id})`);
    } catch (error) {
      logger.error('Error deleting vendor:', error);
      throw error;
    }
  }

  /**
   * Get vendor statistics
   */
  async getVendorStats(
    tenantId: string,
    vendorId: string
  ): Promise<{
    totalPurchaseOrders: number;
    totalPurchased: number;
    currentBalance: number;
    averageDeliveryTime: number;
    pendingOrders: number;
    completedOrders: number;
  }> {
    try {
      const Vendor = await this.getVendorModel(tenantId);
      const connection = await getTenantConnection(tenantId);
      const PO = connection.model('PurchaseOrder', PurchaseOrderSchema);

      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        throw new AppError('Vendor not found', 404);
      }

      const pendingOrders = await PO.countDocuments({
        vendor: vendorId,
        status: { $in: ['draft', 'sent', 'confirmed', 'partially_received'] },
      });

      const completedOrders = await PO.countDocuments({
        vendor: vendorId,
        status: 'received',
      });

      return {
        totalPurchaseOrders: vendor.totalPurchaseOrders,
        totalPurchased: vendor.totalPurchased,
        currentBalance: vendor.currentBalance,
        averageDeliveryTime: vendor.averageDeliveryTime,
        pendingOrders,
        completedOrders,
      };
    } catch (error) {
      logger.error('Error getting vendor stats:', error);
      throw error;
    }
  }
}

