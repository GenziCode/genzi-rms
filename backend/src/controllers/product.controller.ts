import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { successResponse } from '../utils/response';
import { AppError } from '../utils/appError';
// File upload disabled - import { getFileUrl } from '../middleware/upload.middleware';

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  /**
   * Create a new product
   * POST /api/products
   */
  createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;

      const product = await this.productService.createProduct(tenantId, userId, req.body);

      // Add full URLs for images and QR code
      const productData = product.toObject();
      // Image URL processing disabled
      // if (productData.images && productData.images.length > 0) {
      //   productData.images = productData.images.map((img: string) => getFileUrl(req, img));
      // }
      // QR code URL processing disabled
      // if (productData.qrCode) {
      //   productData.qrCode = getFileUrl(req, productData.qrCode);
      // }

      res.status(201).json(successResponse(productData, 'Product created successfully', 201));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all products
   * GET /api/products
   */
  getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const {
        category,
        search,
        minPrice,
        maxPrice,
        inStock,
        isActive,
        sortBy,
        sortOrder,
        page,
        limit,
      } = req.query;

      const result = await this.productService.getProducts(tenantId, {
        category: category as string,
        search: search as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        inStock: inStock === 'true',
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      // File URL processing disabled

      res.json(
        successResponse(result, 'Products retrieved successfully', 200, {
          pagination: {
            page: result.page,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
            total: result.total,
            totalPages: result.totalPages,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get product by ID
   * GET /api/products/:id
   */
  getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { id } = req.params;

      const product = await this.productService.getProductById(tenantId, id);

      // Add full URLs
      const productData = product.toObject();
      // Image URL processing disabled
      // if (productData.images && productData.images.length > 0) {
      //   productData.images = productData.images.map((img: string) => getFileUrl(req, img));
      // }
      // QR code URL processing disabled
      // if (productData.qrCode) {
      //   productData.qrCode = getFileUrl(req, productData.qrCode);
      // }

      res.json(successResponse(productData, 'Product retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get product by SKU
   * GET /api/products/sku/:sku
   */
  getProductBySKU = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { sku } = req.params;

      const product = await this.productService.getProductBySKU(tenantId, sku);

      // Add full URLs
      const productData = product.toObject();
      // Image URL processing disabled
      // if (productData.images && productData.images.length > 0) {
      //   productData.images = productData.images.map((img: string) => getFileUrl(req, img));
      // }
      // QR code URL processing disabled
      // if (productData.qrCode) {
      //   productData.qrCode = getFileUrl(req, productData.qrCode);
      // }

      res.json(successResponse(productData, 'Product retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Scan QR code and get product
   * POST /api/products/scan-qr
   */
  scanQRCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { qrData } = req.body;

      if (!qrData) {
        throw new AppError('QR code data is required', 400);
      }

      const product = await this.productService.getProductByQRCode(tenantId, qrData);

      // Add full URLs
      const productData = product.toObject();
      // Image URL processing disabled
      // if (productData.images && productData.images.length > 0) {
      //   productData.images = productData.images.map((img: string) => getFileUrl(req, img));
      // }
      // QR code URL processing disabled
      // if (productData.qrCode) {
      //   productData.qrCode = getFileUrl(req, productData.qrCode);
      // }

      res.json(successResponse(productData, 'Product scanned successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update product
   * PUT /api/products/:id
   */
  updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { id } = req.params;

      const product = await this.productService.updateProduct(tenantId, id, userId, req.body);

      // Add full URLs
      const productData = product.toObject();
      // Image URL processing disabled
      // if (productData.images && productData.images.length > 0) {
      //   productData.images = productData.images.map((img: string) => getFileUrl(req, img));
      // }
      // QR code URL processing disabled
      // if (productData.qrCode) {
      //   productData.qrCode = getFileUrl(req, productData.qrCode);
      // }

      res.json(successResponse(productData, 'Product updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  // ========================================
  // IMAGE UPLOAD METHOD - DISABLED
  // ========================================
  // uploadImage method removed - file uploads disabled

  /**
   * Delete product
   * DELETE /api/products/:id
   */
  deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { id } = req.params;

      await this.productService.deleteProduct(tenantId, id, userId);

      res.json(successResponse(null, 'Product deleted successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Adjust product stock
   * POST /api/products/:id/adjust-stock
   */
  adjustStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { id } = req.params;
      const { adjustment, reason } = req.body;

      if (typeof adjustment !== 'number') {
        throw new AppError('Adjustment must be a number', 400);
      }

      const product = await this.productService.adjustStock(
        tenantId,
        id,
        userId,
        adjustment,
        reason
      );

      res.json(successResponse(product, 'Stock adjusted successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get low stock products
   * GET /api/products/low-stock
   */
  getLowStockProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;

      const products = await this.productService.getLowStockProducts(tenantId);

      const plainProducts = products.map((product) => product.toObject());

      res.json(successResponse(plainProducts, 'Low stock products retrieved successfully'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk import products
   * POST /api/products/bulk-import
   */
  bulkImport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { products } = req.body;

      if (!Array.isArray(products)) {
        throw new AppError('Products must be an array', 400);
      }

      const results = await this.productService.bulkImportProducts(tenantId, userId, products);

      res.json(successResponse(results, 'Bulk import completed', 200));
    } catch (error) {
      next(error);
    }
  };
}
