import { body, param, query } from 'express-validator';

/**
 * Create Product Validations
 */
export const createProductValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isMongoId()
    .withMessage('Invalid category ID'),
  body('sku')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('SKU must be between 2 and 50 characters'),
  body('barcode')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Barcode must be between 2 and 50 characters'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
  body('trackInventory').optional().isBoolean().withMessage('Track inventory must be a boolean'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('minStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock must be a non-negative integer'),
  body('unit')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Unit cannot exceed 20 characters'),
  body('taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate must be between 0 and 100'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

/**
 * Update Product Validations
 */
export const updateProductValidation = [
  param('id').isMongoId().withMessage('Invalid product ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('category').optional().isMongoId().withMessage('Invalid category ID'),
  body('sku')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('SKU must be between 2 and 50 characters'),
  body('barcode')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Barcode must be between 2 and 50 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
  body('trackInventory').optional().isBoolean().withMessage('Track inventory must be a boolean'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('minStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock must be a non-negative integer'),
  body('unit')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Unit cannot exceed 20 characters'),
  body('taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate must be between 0 and 100'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

/**
 * Product ID Parameter Validation
 */
export const productIdParamValidation = [param('id').isMongoId().withMessage('Invalid product ID')];

/**
 * SKU Parameter Validation
 */
export const skuParamValidation = [
  param('sku')
    .trim()
    .notEmpty()
    .withMessage('SKU is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('SKU must be between 2 and 50 characters'),
];

/**
 * Scan QR Code Validations
 */
export const scanQRValidation = [
  body('qrData')
    .notEmpty()
    .withMessage('QR code data is required')
    .isString()
    .withMessage('QR code data must be a string'),
];

/**
 * Adjust Stock Validations
 */
export const adjustStockValidation = [
  param('id').isMongoId().withMessage('Invalid product ID'),
  body('adjustment')
    .notEmpty()
    .withMessage('Adjustment is required')
    .isInt()
    .withMessage('Adjustment must be an integer'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters'),
];

/**
 * Get Products Query Validations
 */
export const getProductsValidation = [
  query('category').optional().isMongoId().withMessage('Invalid category ID'),
  query('search').optional().trim(),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  query('inStock')
    .optional()
    .isIn(['true', 'false', '1', '0'])
    .withMessage('inStock must be a boolean value'),
  query('isActive')
    .optional()
    .isIn(['true', 'false', '1', '0'])
    .withMessage('isActive must be a boolean value'),
  query('sortBy')
    .optional()
    .isIn(['name', 'price', 'stock', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

/**
 * Bulk Import Validations
 */
export const bulkImportValidation = [
  body('products').isArray({ min: 1 }).withMessage('Products must be a non-empty array'),
];

