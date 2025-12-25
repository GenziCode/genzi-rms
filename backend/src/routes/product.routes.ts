import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { auditMiddleware } from '../middleware/audit.middleware';
import { requireFormAccess } from '../middleware/formPermission.middleware';
import { param } from 'express-validator';
import {
  createProductValidation,
  updateProductValidation,
  productIdParamValidation,
  skuParamValidation,
  scanQRValidation,
  adjustStockValidation,
  getProductsValidation,
  bulkImportValidation,
} from '../validations/product.validations';

const router = Router();
const productController = new ProductController();

// All routes require tenant context and authentication
// Note: resolveTenant is already applied in routes/index.ts
// So we only need authenticate here
router.use(authenticate);

// All product routes require form access
router.use(requireFormAccess('frmProductFields'));

/**
 * Routes
 */

// GET /api/products/low-stock - Get low stock products (must be before /:id)
router.get('/low-stock', productController.getLowStockProducts);

// GET /api/products/sku/:sku - Get product by SKU (must be before /:id)
router.get('/sku/:sku', [...skuParamValidation, validate], productController.getProductBySKU);

// GET /api/products/barcode/:code - Get product by barcode (must be before /:id)
router.get('/barcode/:code', [param('code').notEmpty().withMessage('Barcode is required'), validate], productController.getProductByBarcode);

// GET /api/products/qr/:data - Get product by QR code (must be before /:id)
router.get('/qr/:data', [param('data').notEmpty().withMessage('QR data is required'), validate], productController.scanQRCode);

// GET /api/products/stats - Get product statistics (must be before /:id)
router.get('/stats', productController.getProductStats);

// POST /api/products/scan-qr - Scan QR code
router.post('/scan-qr', [...scanQRValidation, validate], productController.scanQRCode);

// POST /api/products/bulk-import - Bulk import products
router.post('/bulk-import', [...bulkImportValidation, validate], productController.bulkImport);

// POST /api/products - Create product
router.post(
  '/',
  [...createProductValidation, validate],
  auditMiddleware({ action: 'create', entityType: 'product' }),
  productController.createProduct
);

// GET /api/products - Get all products
router.get('/', [...getProductsValidation, validate], productController.getProducts);

// GET /api/products/:id - Get product by ID
router.get('/:id', [...productIdParamValidation, validate], productController.getProductById);

// PUT /api/products/:id - Update product
router.put(
  '/:id',
  [...updateProductValidation, validate],
  auditMiddleware({ action: 'update', entityType: 'product' }),
  productController.updateProduct
);

// DELETE /api/products/:id - Delete product
router.delete(
  '/:id',
  [...productIdParamValidation, validate],
  auditMiddleware({ action: 'delete', entityType: 'product' }),
  productController.deleteProduct
);

// POST /api/products/:id/adjust-stock - Adjust stock
router.post(
  '/:id/adjust-stock',
  [...adjustStockValidation, validate],
  auditMiddleware({
    action: 'update',
    entityType: 'product',
    metadataBuilder: (req) => ({
      adjustment: req.body.adjustment,
      reason: req.body.reason,
    }),
  }),
  productController.adjustStock
);

// ========================================
// IMAGE UPLOAD ENDPOINTS - DISABLED
// ========================================
// These endpoints are disabled to reduce complexity
// Products can still have image URLs via the 'images' field
// Uncomment and add imports when ready to enable:
//
// import { uploadImage } from '../middleware/upload.middleware';
// import { fileController } from '../controllers/file.controller';
// import { isValidMongoId } from '../utils/validators';
//
// router.post('/:id/upload-image', productIdValidation, validate, productController.uploadImage);
// router.post('/:id/images', uploadImage('image'), fileController.addProductImage);
// router.delete('/:id/images/:index', fileController.deleteProductImage);

export default router;
