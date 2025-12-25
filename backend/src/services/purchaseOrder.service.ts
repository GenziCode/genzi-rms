import { getTenantConnection } from '../config/database';
import { PurchaseOrderSchema, IPurchaseOrder, IPurchaseOrderItem } from '../models/purchaseOrder.model';
import { VendorSchema, IVendor } from '../models/vendor.model';
import { ProductSchema, IProduct } from '../models/product.model';
import { StockMovementSchema } from '../models/inventory.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

interface CreatePOData {
  vendorId: string;
  storeId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number; // Frontend sends unitPrice
    unitCost?: number; // Alias for unitPrice
    discount?: number; // Discount percentage
    tax?: number; // Tax percentage (overrides product taxRate if provided)
  }>;
  expectedDeliveryDate?: Date;
  expectedDate?: Date; // Alias for expectedDeliveryDate
  shippingCost?: number;
  paymentTerms?: string;
  notes?: string;
}

export class PurchaseOrderService {
  private async getPOModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
  }

  private async getVendorModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<IVendor>('Vendor', VendorSchema);
  }

  private async getProductModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<IProduct>('Product', ProductSchema);
  }

  /**
   * Create purchase order
   */
  async createPurchaseOrder(
    tenantId: string,
    userId: string,
    data: CreatePOData
  ): Promise<IPurchaseOrder> {
    try {
      const PO = await this.getPOModel(tenantId);
      const Vendor = await this.getVendorModel(tenantId);
      const Product = await this.getProductModel(tenantId);

      // Validate vendor
      const vendor = await Vendor.findById(data.vendorId);
      if (!vendor) {
        throw new AppError('Vendor not found', 404);
      }
      if (!vendor.isActive) {
        throw new AppError('Vendor is not active', 400);
      }

      // Build PO items
      const poItems: IPurchaseOrderItem[] = [];
      let subtotal = 0;
      let totalTax = 0;
      let totalDiscount = 0;

      for (const item of data.items) {
        const product = await Product.findById(item.productId);
        if (!product) {
          throw new AppError(`Product not found: ${item.productId}`, 404);
        }

        // Use unitPrice or unitCost (frontend sends unitPrice)
        const unitCost = item.unitPrice || item.unitCost || 0;
        if (unitCost <= 0) {
          throw new AppError(`Invalid unit price for product: ${product.name}`, 400);
        }

        // Calculate item totals with discount and tax
        const itemSubtotal = item.quantity * unitCost;
        const discountPercent = item.discount || 0;
        const discountAmount = (itemSubtotal * discountPercent) / 100;
        const afterDiscount = itemSubtotal - discountAmount;
        
        // Use provided tax rate or fall back to product taxRate
        const taxRate = item.tax !== undefined ? item.tax : (product.taxRate || 0);
        const itemTax = (afterDiscount * taxRate) / 100;
        const itemTotal = afterDiscount + itemTax;

        poItems.push({
          product: product._id,
          name: product.name,
          sku: product.sku,
          quantity: item.quantity,
          unitCost: unitCost,
          discount: discountPercent,
          discountAmount: discountAmount,
          tax: itemTax,
          taxRate,
          total: itemTotal,
          receivedQuantity: 0,
        });

        subtotal += afterDiscount; // Subtotal after discounts
        totalTax += itemTax;
        totalDiscount += discountAmount;
      }

      const shippingCost = data.shippingCost || 0;
      const total = subtotal + totalTax + shippingCost;

      const poData: any = {
        tenantId,
        vendor: data.vendorId,
        store: data.storeId,
        items: poItems,
        subtotal,
        tax: totalTax,
        shippingCost,
        total,
        expectedDate: data.expectedDeliveryDate || data.expectedDate,
        notes: data.notes,
        createdBy: userId,
      };

      // Add paymentTerms if provided
      if (data.paymentTerms) {
        poData.paymentTerms = data.paymentTerms;
      }

      const po = new PO(poData);
      await po.save();

      // Update vendor stats
      vendor.totalPurchaseOrders += 1;
      await vendor.save();

      logger.info(`Purchase Order created: ${po.poNumber} - Total: ${total}`);
      
      // Transform response to match frontend expectations
      const poResponse = po.toObject();
      return {
        ...poResponse,
        vendorName: vendor.name || vendor.company || 'N/A',
        vendorCompany: vendor.company || vendor.name || 'N/A',
        grandTotal: poResponse.total || 0,
        total: poResponse.total || 0,
        totalDiscount: totalDiscount || 0,
        totalTax: poResponse.tax || 0,
        expectedDeliveryDate: poResponse.expectedDate,
        expectedDate: poResponse.expectedDate,
      };
    } catch (error) {
      logger.error('Error creating purchase order:', error);
      throw error;
    }
  }

  /**
   * Get all purchase orders
   */
  async getPurchaseOrders(
    tenantId: string,
    options: {
      vendorId?: string;
      storeId?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
      search?: any;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    purchaseOrders: IPurchaseOrder[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const PO = await this.getPOModel(tenantId);

      const {
        vendorId,
        storeId,
        status,
        startDate,
        endDate,
        search,
        page = 1,
        limit = 50,
      } = options;

      const query: any = { tenantId };

      if (vendorId) query.vendor = vendorId;
      if (storeId) query.store = storeId;
      if (status) query.status = status;

      if (startDate || endDate) {
        query.orderDate = {};
        if (startDate) query.orderDate.$gte = startDate;
        if (endDate) query.orderDate.$lte = endDate;
      }

      // Merge search query if provided
      if (search && Object.keys(search).length > 0) {
        Object.assign(query, search);
      }

      const total = await PO.countDocuments(query);

      const purchaseOrders = await PO.find(query)
        .sort('-orderDate')
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('vendor', 'company name phone email')
        .lean();

      // Transform to include vendor name/company and match frontend expectations
      const transformedPOs = purchaseOrders.map((po: any) => {
        // Calculate totalDiscount from items if not present
        let totalDiscount = 0;
        if (po.items && Array.isArray(po.items)) {
          po.items.forEach((item: any) => {
            const itemSubtotal = item.quantity * item.unitCost;
            const itemTotal = item.total || 0;
            // Use discountAmount if available, otherwise calculate from discount percentage
            if (item.discountAmount !== undefined && item.discountAmount > 0) {
              totalDiscount += item.discountAmount;
            } else if (item.discount !== undefined && item.discount > 0) {
              totalDiscount += (itemSubtotal * item.discount) / 100;
            }
          });
        }

        return {
          ...po,
          vendorName: po.vendor?.name || po.vendor?.company || 'N/A',
          vendorCompany: po.vendor?.company || po.vendor?.name || 'N/A',
          grandTotal: po.total || po.grandTotal || 0,
          total: po.total || po.grandTotal || 0, // Ensure both fields exist
          totalDiscount: po.totalDiscount || totalDiscount || 0,
          totalTax: po.tax || 0,
          expectedDeliveryDate: po.expectedDate || po.expectedDeliveryDate,
          expectedDate: po.expectedDate,
        };
      });

      return {
        purchaseOrders: transformedPOs,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error getting purchase orders:', error);
      throw error;
    }
  }

  /**
   * Get PO by ID
   */
  async getPOById(tenantId: string, poId: string): Promise<any> {
    try {
      const PO = await this.getPOModel(tenantId);

      const po = await PO.findById(poId).populate('vendor', 'company name phone email address').lean();

      if (!po) {
        throw new AppError('Purchase order not found', 404);
      }

      // Calculate totalDiscount from items
      let totalDiscount = 0;
      if (po.items && Array.isArray(po.items)) {
        po.items.forEach((item: any) => {
          // Use discountAmount if available, otherwise calculate from discount percentage
          if (item.discountAmount !== undefined && item.discountAmount > 0) {
            totalDiscount += item.discountAmount;
          } else if (item.discount !== undefined && item.discount > 0) {
            const itemSubtotal = item.quantity * item.unitCost;
            totalDiscount += (itemSubtotal * item.discount) / 100;
          }
        });
      }

      // Transform to match frontend expectations
      return {
        ...po,
        vendorName: po.vendor?.name || po.vendor?.company || 'N/A',
        vendorCompany: po.vendor?.company || po.vendor?.name || 'N/A',
        grandTotal: po.total || 0,
        total: po.total || 0,
        totalDiscount: totalDiscount || 0,
        totalTax: po.tax || 0,
        expectedDeliveryDate: po.expectedDate,
        expectedDate: po.expectedDate,
      };
    } catch (error) {
      logger.error('Error getting purchase order:', error);
      throw error;
    }
  }

  /**
   * Send PO to vendor (mark as sent)
   */
  async sendPO(
    tenantId: string,
    poId: string,
    userId: string
  ): Promise<IPurchaseOrder> {
    try {
      const PO = await this.getPOModel(tenantId);

      const po = await PO.findById(poId);
      if (!po) {
        throw new AppError('Purchase order not found', 404);
      }

      if (po.status !== 'draft') {
        throw new AppError('Only draft POs can be sent', 400);
      }

      po.status = 'sent';
      po.sentBy = userId as any;
      po.updatedBy = userId as any;
      await po.save();

      logger.info(`Purchase Order sent: ${po.poNumber}`);
      return po;
    } catch (error) {
      logger.error('Error sending purchase order:', error);
      throw error;
    }
  }

  /**
   * Receive goods (GRN - Goods Receipt Note)
   */
  async receiveGoods(
    tenantId: string,
    poId: string,
    userId: string,
    data: {
      items: Array<{
        productId: string;
        receivedQuantity: number;
      }>;
      vendorInvoiceNumber?: string;
      notes?: string;
    }
  ): Promise<IPurchaseOrder> {
    try {
      const PO = await this.getPOModel(tenantId);
      const Product = await this.getProductModel(tenantId);
      const connection = await getTenantConnection(tenantId);
      const StockMovement = connection.model('StockMovement', StockMovementSchema);

      const po = await PO.findById(poId);
      if (!po) {
        throw new AppError('Purchase order not found', 404);
      }

      if (po.status === 'cancelled') {
        throw new AppError('Cannot receive cancelled PO', 400);
      }

      if (po.status === 'received') {
        throw new AppError('PO already fully received', 400);
      }

      // Update received quantities
      for (const receivedItem of data.items) {
        const poItem = po.items.find(
          (item) => item.product.toString() === receivedItem.productId
        );

        if (!poItem) {
          throw new AppError(`Product not found in PO: ${receivedItem.productId}`, 400);
        }

        if (receivedItem.receivedQuantity > poItem.quantity) {
          throw new AppError(
            `Received quantity (${receivedItem.receivedQuantity}) exceeds ordered quantity (${poItem.quantity})`,
            400
          );
        }

        const previousReceived = poItem.receivedQuantity || 0;
        poItem.receivedQuantity = (poItem.receivedQuantity || 0) + receivedItem.receivedQuantity;

        // Update product stock
        const product = await Product.findById(receivedItem.productId);
        if (product && product.trackInventory) {
          const quantityBefore = product.stock || 0;
          product.stock = quantityBefore + receivedItem.receivedQuantity;
          await product.save();

          // Record stock movement
          await new StockMovement({
            tenantId,
            product: product._id,
            store: po.store,
            type: 'restock',
            quantity: receivedItem.receivedQuantity,
            quantityBefore,
            quantityAfter: product.stock,
            reason: `Purchase Order: ${po.poNumber}`,
            reference: po._id,
            referenceType: 'PurchaseOrder',
            notes: data.notes,
            createdBy: userId,
          }).save();

          logger.info(
            `Stock updated for ${product.name}: ${quantityBefore} → ${product.stock}`
          );
        }
      }

      // Check if all items fully received
      const allReceived = po.items.every(
        (item) => (item.receivedQuantity || 0) === item.quantity
      );

      if (allReceived) {
        po.status = 'received';
        po.receivedDate = new Date();
      } else {
        po.status = 'partially_received';
      }

      po.receivedBy = userId as any;
      po.vendorInvoiceNumber = data.vendorInvoiceNumber;
      po.updatedBy = userId as any;
      await po.save();

      // Update vendor stats
      const Vendor = await this.getVendorModel(tenantId);
      const vendor = await Vendor.findById(po.vendor);
      if (vendor) {
        vendor.totalPurchased += po.total;
        vendor.currentBalance += po.total; // Assuming payment not made yet
        vendor.lastPurchaseDate = new Date();
        await vendor.save();
      }

      logger.info(`Goods received for PO: ${po.poNumber}`);
      return po;
    } catch (error) {
      logger.error('Error receiving goods:', error);
      throw error;
    }
  }

  /**
   * Cancel purchase order
   */
  async cancelPO(
    tenantId: string,
    poId: string,
    userId: string,
    reason: string
  ): Promise<IPurchaseOrder> {
    try {
      const PO = await this.getPOModel(tenantId);

      const po = await PO.findById(poId);
      if (!po) {
        throw new AppError('Purchase order not found', 404);
      }

      if (po.status === 'received') {
        throw new AppError('Cannot cancel received PO', 400);
      }

      if (po.status === 'partially_received') {
        throw new AppError('Cannot cancel partially received PO', 400);
      }

      po.status = 'cancelled';
      po.cancelledDate = new Date();
      po.cancelledBy = userId as any;
      po.cancellationReason = reason;
      po.updatedBy = userId as any;
      await po.save();

      logger.info(`Purchase Order cancelled: ${po.poNumber} - Reason: ${reason}`);
      return po;
    } catch (error) {
      logger.error('Error cancelling purchase order:', error);
      throw error;
    }
  }

  /**
   * Get purchase order statistics
   */
  async getPOStats(tenantId: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      const PO = await this.getPOModel(tenantId);
      const Vendor = await this.getVendorModel(tenantId);

      const query: any = { tenantId };
      if (dateRange) {
        query.orderDate = {
          $gte: dateRange.start,
          $lte: dateRange.end,
        };
      }

      const allPOs = await PO.find(query).lean();
      const previousPeriodStart = dateRange 
        ? new Date(dateRange.start.getTime() - (dateRange.end.getTime() - dateRange.start.getTime()))
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const previousPeriodEnd = dateRange ? dateRange.start : new Date();

      const previousPOs = await PO.find({
        tenantId,
        orderDate: {
          $gte: previousPeriodStart,
          $lt: previousPeriodEnd,
        },
      }).lean();

      // Calculate totals
      const totalPOs = allPOs.length;
      const totalValue = allPOs.reduce((sum, po) => sum + (po.total || 0), 0);
      const pendingPOs = allPOs.filter(po => ['draft', 'pending', 'approved', 'ordered'].includes(po.status)).length;
      const completedPOs = allPOs.filter(po => po.status === 'received').length;

      // Previous period totals
      const prevTotalPOs = previousPOs.length;
      const prevTotalValue = previousPOs.reduce((sum, po) => sum + (po.total || 0), 0);
      const prevPendingPOs = previousPOs.filter(po => ['draft', 'pending', 'approved', 'ordered'].includes(po.status)).length;
      const prevCompletedPOs = previousPOs.filter(po => po.status === 'received').length;

      // Calculate changes
      const totalPOsChange = prevTotalPOs > 0 ? ((totalPOs - prevTotalPOs) / prevTotalPOs) * 100 : 0;
      const totalValueChange = prevTotalValue > 0 ? ((totalValue - prevTotalValue) / prevTotalValue) * 100 : 0;
      const pendingPOsChange = prevPendingPOs > 0 ? ((pendingPOs - prevPendingPOs) / prevPendingPOs) * 100 : 0;
      const completedPOsChange = prevCompletedPOs > 0 ? ((completedPOs - prevCompletedPOs) / prevCompletedPOs) * 100 : 0;

      // Status distribution
      const statusDistribution = [
        'draft', 'pending', 'approved', 'ordered', 'received', 'cancelled'
      ].map(status => {
        const count = allPOs.filter(po => po.status === status).length;
        const value = allPOs
          .filter(po => po.status === status)
          .reduce((sum, po) => sum + (po.total || 0), 0);
        return { status, count, value };
      }).filter(item => item.count > 0);

      // Trend data (last 30 days)
      const trendData: Array<{ date: string; orders: number; value: number }> = [];
      const days = 30;
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayPOs = allPOs.filter(po => {
          const poDate = new Date(po.orderDate);
          return poDate >= date && poDate < nextDate;
        });

        trendData.push({
          date: date.toISOString().split('T')[0],
          orders: dayPOs.length,
          value: dayPOs.reduce((sum, po) => sum + (po.total || 0), 0),
        });
      }

      // Top vendors
      const vendorMap = new Map<string, { orders: number; value: number }>();
      allPOs.forEach(po => {
        const vendorId = po.vendor.toString();
        const current = vendorMap.get(vendorId) || { orders: 0, value: 0 };
        vendorMap.set(vendorId, {
          orders: current.orders + 1,
          value: current.value + (po.total || 0),
        });
      });

      const topVendors = await Promise.all(
        Array.from(vendorMap.entries())
          .sort((a, b) => b[1].value - a[1].value)
          .slice(0, 10)
          .map(async ([vendorId, stats]) => {
            const vendor = await Vendor.findById(vendorId).lean();
            return {
              vendorName: vendor?.name || vendor?.company || 'Unknown',
              orders: stats.orders,
              value: stats.value,
            };
          })
      );

      // Alerts
      const alerts: Array<{ title: string; message: string }> = [];
      const overduePOs = allPOs.filter(po => {
        if (!po.expectedDate || po.status === 'received' || po.status === 'cancelled') return false;
        return new Date(po.expectedDate) < new Date();
      });
      if (overduePOs.length > 0) {
        alerts.push({
          title: `${overduePOs.length} Overdue Purchase Order${overduePOs.length > 1 ? 's' : ''}`,
          message: `You have ${overduePOs.length} purchase order(s) that are past their expected delivery date.`,
        });
      }

      return {
        totalPOs,
        totalPOsChange: Math.round(totalPOsChange * 100) / 100,
        totalValue,
        totalValueChange: Math.round(totalValueChange * 100) / 100,
        pendingPOs,
        pendingPOsChange: Math.round(pendingPOsChange * 100) / 100,
        completedPOs,
        completedPOsChange: Math.round(completedPOsChange * 100) / 100,
        statusDistribution,
        trendData,
        topVendors,
        alerts,
      };
    } catch (error) {
      logger.error('Error getting PO stats:', error);
      throw error;
    }
  }
}

