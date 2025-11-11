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
    unitCost: number;
  }>;
  expectedDate?: Date;
  shippingCost?: number;
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

      for (const item of data.items) {
        const product = await Product.findById(item.productId);
        if (!product) {
          throw new AppError(`Product not found: ${item.productId}`, 404);
        }

        const taxRate = product.taxRate || 0;
        const itemSubtotal = item.quantity * item.unitCost;
        const itemTax = (itemSubtotal * taxRate) / 100;
        const itemTotal = itemSubtotal + itemTax;

        poItems.push({
          product: product._id,
          name: product.name,
          sku: product.sku,
          quantity: item.quantity,
          unitCost: item.unitCost,
          tax: itemTax,
          taxRate,
          total: itemTotal,
          receivedQuantity: 0,
        });

        subtotal += itemSubtotal;
        totalTax += itemTax;
      }

      const shippingCost = data.shippingCost || 0;
      const total = subtotal + totalTax + shippingCost;

      const po = new PO({
        tenantId,
        vendor: data.vendorId,
        store: data.storeId,
        items: poItems,
        subtotal,
        tax: totalTax,
        shippingCost,
        total,
        expectedDate: data.expectedDate,
        notes: data.notes,
        createdBy: userId,
      });

      await po.save();

      // Update vendor stats
      vendor.totalPurchaseOrders += 1;
      await vendor.save();

      logger.info(`Purchase Order created: ${po.poNumber} - Total: ${total}`);
      return po;
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
        page = 1,
        limit = 50,
      } = options;

      const query: any = {};

      if (vendorId) query.vendor = vendorId;
      if (storeId) query.store = storeId;
      if (status) query.status = status;

      if (startDate || endDate) {
        query.orderDate = {};
        if (startDate) query.orderDate.$gte = startDate;
        if (endDate) query.orderDate.$lte = endDate;
      }

      const total = await PO.countDocuments(query);

      const purchaseOrders = await PO.find(query)
        .sort('-orderDate')
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('vendor', 'company name phone');

      return {
        purchaseOrders,
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
  async getPOById(tenantId: string, poId: string): Promise<IPurchaseOrder> {
    try {
      const PO = await this.getPOModel(tenantId);

      const po = await PO.findById(poId).populate('vendor', 'company name phone email address');

      if (!po) {
        throw new AppError('Purchase order not found', 404);
      }

      return po;
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
}

