import { getTenantConnection } from '../config/database';
import { ProductSchema } from '../models/product.model';
import { SaleSchema } from '../models/sale.model';
import { CustomerSchema } from '../models/customer.model';
import { StockMovementSchema } from '../models/inventory.model';
import { logger } from '../utils/logger';
import { createObjectCsvStringifier } from 'csv-writer';

export class ExportService {
  /**
   * Export products to CSV
   */
  async exportProducts(tenantId: string): Promise<string> {
    try {
      const connection = await getTenantConnection(tenantId);
      const Product = connection.model('Product', ProductSchema);

      const products = await Product.find({ isActive: true })
        .populate('category', 'name')
        .sort('sku');

      const csvStringifier = createObjectCsvStringifier({
        header: [
          { id: 'sku', title: 'SKU' },
          { id: 'name', title: 'Name' },
          { id: 'category', title: 'Category' },
          { id: 'price', title: 'Price' },
          { id: 'cost', title: 'Cost' },
          { id: 'stock', title: 'Stock' },
          { id: 'minStock', title: 'Min Stock' },
          { id: 'unit', title: 'Unit' },
          { id: 'taxRate', title: 'Tax Rate %' },
          { id: 'status', title: 'Status' },
          { id: 'createdAt', title: 'Created Date' },
        ],
      });

      const records = products.map((p: any) => ({
        sku: p.sku,
        name: p.name,
        category: p.category?.name || 'N/A',
        price: p.price,
        cost: p.cost || 0,
        stock: p.stock || 0,
        minStock: p.minStock || 0,
        unit: p.unit || 'pcs',
        taxRate: p.taxRate || 0,
        status: p.isActive ? 'active' : 'inactive',
        createdAt: p.createdAt.toISOString().split('T')[0],
      }));

      const csv = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

      logger.info(`Exported ${products.length} products to CSV`);
      return csv;
    } catch (error) {
      logger.error('Error exporting products:', error);
      throw error;
    }
  }

  /**
   * Export sales to CSV
   */
  async exportSales(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    try {
      const connection = await getTenantConnection(tenantId);
      const Sale = connection.model('Sale', SaleSchema);

      const query: any = { status: 'completed' };

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = startDate;
        if (endDate) query.createdAt.$lte = endDate;
      }

      const sales = await Sale.find(query)
        .populate('customer', 'name phone')
        .sort('-createdAt');

      const csvStringifier = createObjectCsvStringifier({
        header: [
          { id: 'saleNumber', title: 'Sale Number' },
          { id: 'date', title: 'Date' },
          { id: 'time', title: 'Time' },
          { id: 'customer', title: 'Customer' },
          { id: 'itemCount', title: 'Items' },
          { id: 'subtotal', title: 'Subtotal' },
          { id: 'discount', title: 'Discount' },
          { id: 'tax', title: 'Tax' },
          { id: 'total', title: 'Total' },
          { id: 'paymentMethods', title: 'Payment Methods' },
          { id: 'status', title: 'Status' },
        ],
      });

      const records = sales.map((s: any) => ({
        saleNumber: s.saleNumber,
        date: s.createdAt.toISOString().split('T')[0],
        time: s.createdAt.toTimeString().split(' ')[0],
        customer: s.customer?.name || 'Walk-in',
        itemCount: s.items.length,
        subtotal: s.subtotal.toFixed(2),
        discount: s.discount.toFixed(2),
        tax: s.tax.toFixed(2),
        total: s.total.toFixed(2),
        paymentMethods: s.payments.map((p: any) => p.method).join(', '),
        status: s.status,
      }));

      const csv = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

      logger.info(`Exported ${sales.length} sales to CSV`);
      return csv;
    } catch (error) {
      logger.error('Error exporting sales:', error);
      throw error;
    }
  }

  /**
   * Export customers to CSV
   */
  async exportCustomers(tenantId: string): Promise<string> {
    try {
      const connection = await getTenantConnection(tenantId);
      const Customer = connection.model('Customer', CustomerSchema);

      const customers = await Customer.find({ isActive: true }).sort('name');

      const csvStringifier = createObjectCsvStringifier({
        header: [
          { id: 'name', title: 'Name' },
          { id: 'email', title: 'Email' },
          { id: 'phone', title: 'Phone' },
          { id: 'loyaltyPoints', title: 'Loyalty Points' },
          { id: 'loyaltyTier', title: 'Loyalty Tier' },
          { id: 'totalPurchases', title: 'Total Purchases' },
          { id: 'totalSpent', title: 'Total Spent' },
          { id: 'averageOrderValue', title: 'Avg Order Value' },
          { id: 'lastPurchase', title: 'Last Purchase' },
          { id: 'creditBalance', title: 'Credit Balance' },
          { id: 'joinedDate', title: 'Joined Date' },
        ],
      });

      const records = customers.map((c: any) => ({
        name: c.name,
        email: c.email || 'N/A',
        phone: c.phone,
        loyaltyPoints: c.loyaltyPoints,
        loyaltyTier: c.loyaltyTier,
        totalPurchases: c.totalPurchases,
        totalSpent: c.totalSpent.toFixed(2),
        averageOrderValue: c.averageOrderValue.toFixed(2),
        lastPurchase: c.lastPurchase ? c.lastPurchase.toISOString().split('T')[0] : 'N/A',
        creditBalance: c.creditBalance.toFixed(2),
        joinedDate: c.createdAt.toISOString().split('T')[0],
      }));

      const csv = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

      logger.info(`Exported ${customers.length} customers to CSV`);
      return csv;
    } catch (error) {
      logger.error('Error exporting customers:', error);
      throw error;
    }
  }

  /**
   * Export inventory movements to CSV
   */
  async exportInventoryMovements(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    try {
      const connection = await getTenantConnection(tenantId);
      const StockMovement = connection.model('StockMovement', StockMovementSchema);

      const query: any = {};

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = startDate;
        if (endDate) query.createdAt.$lte = endDate;
      }

      const movements = await StockMovement.find(query)
        .populate('product', 'name sku')
        .sort('-createdAt');

      const csvStringifier = createObjectCsvStringifier({
        header: [
          { id: 'date', title: 'Date' },
          { id: 'time', title: 'Time' },
          { id: 'product', title: 'Product' },
          { id: 'sku', title: 'SKU' },
          { id: 'type', title: 'Type' },
          { id: 'quantity', title: 'Quantity' },
          { id: 'before', title: 'Stock Before' },
          { id: 'after', title: 'Stock After' },
          { id: 'reason', title: 'Reason' },
        ],
      });

      const records = movements.map((m: any) => ({
        date: m.createdAt.toISOString().split('T')[0],
        time: m.createdAt.toTimeString().split(' ')[0],
        product: m.product?.name || 'N/A',
        sku: m.product?.sku || 'N/A',
        type: m.type,
        quantity: m.quantity > 0 ? `+${m.quantity}` : m.quantity,
        before: m.quantityBefore,
        after: m.quantityAfter,
        reason: m.reason || 'N/A',
      }));

      const csv = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

      logger.info(`Exported ${movements.length} inventory movements to CSV`);
      return csv;
    } catch (error) {
      logger.error('Error exporting inventory movements:', error);
      throw error;
    }
  }
}

