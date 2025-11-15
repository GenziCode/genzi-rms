import { Connection } from 'mongoose';
import { getTenantConnection } from '../config/database';
import { ProductSchema, IProduct } from '../models/product.model';
import { CategorySchema } from '../models/category.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
// File upload disabled - import QRCode from 'qrcode';
// File upload disabled - import path from 'path';
// File upload disabled - import fs from 'fs';
// File upload disabled - import sharp from 'sharp';

export class ProductService {
  private async getProductModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    // Ensure Category is registered before Product (needed for populate)
    if (!connection.models.Category) {
      connection.model('Category', CategorySchema);
    }
    // Return Product model (will be registered by registerBaseTenantModels or create here)
    return connection.models.Product || connection.model<IProduct>('Product', ProductSchema);
  }

  // ========================================
  // QR CODE GENERATION - DISABLED
  // ========================================
  // generateQRCode method removed - QRCode library disabled

  // ========================================
  // IMAGE PROCESSING METHOD - DISABLED
  // ========================================
  // processImage method removed - Sharp disabled

  /**
   * Create a new product
   */
  async createProduct(
    tenantId: string,
    userId: string,
    data: {
      name: string;
      description?: string;
      category: string;
      sku?: string;
      barcode?: string;
      price: number;
      cost?: number;
      trackInventory?: boolean;
      stock?: number;
      minStock?: number;
      unit?: string;
      taxRate?: number;
      images?: string[];
      isActive?: boolean;
      variants?: any[];
    }
  ): Promise<IProduct> {
    try {
      const Product = await this.getProductModel(tenantId);

      // Generate SKU if not provided
      if (!data.sku) {
        const count = await Product.countDocuments();
        data.sku = `PRD${String(count + 1).padStart(6, '0')}`;
      }

      // Check if SKU already exists
      const existingSKU = await Product.findOne({ sku: data.sku });
      if (existingSKU) {
        throw new AppError('Product with this SKU already exists', 409);
      }

      // Check if barcode already exists
      if (data.barcode) {
        const existingBarcode = await Product.findOne({
          barcode: data.barcode,
        });
        if (existingBarcode) {
          throw new AppError('Product with this barcode already exists', 409);
        }
      }

      // Create product
      const product = new Product({
        ...data,
        createdBy: userId,
        updatedBy: userId,
      });

      await product.save();

      // QR code generation DISABLED
      // const qrCodePath = await this.generateQRCode(tenantId, product._id.toString(), product.sku);
      // product.qrCode = qrCodePath;
      await product.save();

      logger.info(`Product created: ${product.name} (${product._id})`);
      return product;
    } catch (error) {
      logger.error('Error creating product:', error);
      throw error;
    }
  }

  /**
   * Get all products
   */
  async getProducts(
    tenantId: string,
    options: {
      category?: string;
      search?: string;
      minPrice?: number;
      maxPrice?: number;
      inStock?: boolean;
      isActive?: boolean;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    products: IProduct[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const Product = await this.getProductModel(tenantId);

      const {
        category,
        search,
        minPrice,
        maxPrice,
        inStock,
        isActive = true,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 50,
      } = options;

      // Build query
      const query: any = {};

      if (isActive !== undefined) {
        query.isActive = isActive;
      }

      if (category) {
        query.category = category;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
          { barcode: { $regex: search, $options: 'i' } },
        ];
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        query.price = {};
        if (minPrice !== undefined) query.price.$gte = minPrice;
        if (maxPrice !== undefined) query.price.$lte = maxPrice;
      }

      if (inStock) {
        query.stock = { $gt: 0 };
      }

      // Count total
      const total = await Product.countDocuments(query);

      // Build sort
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Get products
      const products = await Product.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('category', 'name color icon');

      return {
        products,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error getting products:', error);
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(
    tenantId: string,
    productId: string
  ): Promise<IProduct> {
    try {
      const Product = await this.getProductModel(tenantId);

      const product = await Product.findById(productId)
        .populate('category', 'name color icon');

      if (!product) {
        throw new AppError('Product not found', 404);
      }

      return product;
    } catch (error) {
      logger.error('Error getting product:', error);
      throw error;
    }
  }

  /**
   * Get product by SKU
   */
  async getProductBySKU(tenantId: string, sku: string): Promise<IProduct> {
    try {
      const Product = await this.getProductModel(tenantId);

      const product = await Product.findOne({ sku })
        .populate('category', 'name color icon');

      if (!product) {
        throw new AppError('Product not found', 404);
      }

      return product;
    } catch (error) {
      logger.error('Error getting product by SKU:', error);
      throw error;
    }
  }

  // ========================================
  // GET PRODUCT BY QR CODE - DISABLED
  // ========================================
  // getProductByQRCode method removed - QR code disabled

  /**
   * Update product
   */
  async updateProduct(
    tenantId: string,
    productId: string,
    userId: string,
    data: Partial<IProduct>
  ): Promise<IProduct> {
    try {
      const Product = await this.getProductModel(tenantId);

      const product = await Product.findById(productId);
      if (!product) {
        throw new AppError('Product not found', 404);
      }

      // Check SKU uniqueness if being updated
      if (data.sku && data.sku !== product.sku) {
        const existingSKU = await Product.findOne({
          sku: data.sku,
          _id: { $ne: productId },
        });
        if (existingSKU) {
          throw new AppError('Product with this SKU already exists', 409);
        }
      }

      // Check barcode uniqueness if being updated
      if (data.barcode && data.barcode !== product.barcode) {
        const existingBarcode = await Product.findOne({
          barcode: data.barcode,
          _id: { $ne: productId },
        });
        if (existingBarcode) {
          throw new AppError('Product with this barcode already exists', 409);
        }
      }

      // Update fields
      Object.assign(product, data, { updatedBy: userId });

      // QR code regeneration DISABLED
      // if (data.sku && data.sku !== product.sku) {
      //   const qrCodePath = await this.generateQRCode(tenantId, product._id.toString(), data.sku);
      //   product.qrCode = qrCodePath;
      // }

      await product.save();

      logger.info(`Product updated: ${product.name} (${product._id})`);
      return product;
    } catch (error) {
      logger.error('Error updating product:', error);
      throw error;
    }
  }

  // ========================================
  // IMAGE UPLOAD METHOD - DISABLED
  // ========================================
  // uploadProductImage method removed - file uploads disabled

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(
    tenantId: string,
    productId: string,
    userId: string
  ): Promise<void> {
    try {
      const Product = await this.getProductModel(tenantId);

      const product = await Product.findById(productId);
      if (!product) {
        throw new AppError('Product not found', 404);
      }

      // Soft delete
      product.isActive = false;
      product.updatedBy = userId as any;
      await product.save();

      logger.info(`Product deleted: ${product.name} (${product._id})`);
    } catch (error) {
      logger.error('Error deleting product:', error);
      throw error;
    }
  }

  /**
   * Adjust product stock
   */
  async adjustStock(
    tenantId: string,
    productId: string,
    userId: string,
    adjustment: number,
    reason?: string
  ): Promise<IProduct> {
    try {
      const Product = await this.getProductModel(tenantId);

      const product = await Product.findById(productId);
      if (!product) {
        throw new AppError('Product not found', 404);
      }

      if (!product.trackInventory) {
        throw new AppError('Inventory tracking not enabled for this product', 400);
      }

      const newStock = product.stock + adjustment;
      if (newStock < 0) {
        throw new AppError('Insufficient stock', 400);
      }

      product.stock = newStock;
      product.updatedBy = userId as any;
      await product.save();

      logger.info(
        `Stock adjusted for ${product.name}: ${adjustment} (reason: ${reason})`
      );
      return product;
    } catch (error) {
      logger.error('Error adjusting stock:', error);
      throw error;
    }
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(tenantId: string): Promise<IProduct[]> {
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
   * Bulk import products
   */
  async bulkImportProducts(
    tenantId: string,
    userId: string,
    products: any[]
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const productData of products) {
      try {
        await this.createProduct(tenantId, userId, productData);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          product: productData.name || productData.sku,
          error: error.message,
        });
      }
    }

    return results;
  }
}

