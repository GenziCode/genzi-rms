import { Router } from 'express';
import { query, param, body } from 'express-validator';
import { fileController } from '../controllers/file.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { uploadSingle, uploadMultiple } from '../middleware/upload.middleware';
import { isValidObjectId } from '../utils/validators';

const router = Router();

// Apply authentication and tenant resolution to all routes
router.use(authenticate, resolveTenant);

/**
 * GET /api/files/statistics
 * Get file statistics
 */
router.get('/statistics', fileController.getStatistics);

/**
 * GET /api/files
 * Get all files
 */
router.get(
  '/',
  [
    query('category')
      .optional()
      .isIn(['product_image', 'logo', 'document', 'avatar', 'other'])
      .withMessage('Invalid category'),
    
    query('entityType')
      .optional()
      .trim(),
    
    query('entityId')
      .optional()
      .custom((value) => {
        if (value && !isValidObjectId(value)) {
          throw new Error('Invalid entity ID');
        }
        return true;
      }),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    validate,
  ],
  fileController.getAll
);

/**
 * GET /api/files/:id
 * Get file by ID
 */
router.get(
  '/:id',
  [
    param('id')
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid file ID');
        }
        return true;
      }),
    validate,
  ],
  fileController.getById
);

/**
 * POST /api/files/upload
 * Upload single file
 */
router.post(
  '/upload',
  uploadSingle('file'),
  [
    body('category')
      .optional()
      .isIn(['product_image', 'logo', 'document', 'avatar', 'other'])
      .withMessage('Invalid category'),
    
    body('entityType')
      .optional()
      .trim(),
    
    body('entityId')
      .optional()
      .custom((value) => {
        if (value && !isValidObjectId(value)) {
          throw new Error('Invalid entity ID');
        }
        return true;
      }),
    
    validate,
  ],
  fileController.uploadFile
);

/**
 * POST /api/files/upload-multiple
 * Upload multiple files
 */
router.post(
  '/upload-multiple',
  uploadMultiple('files', 10),
  [
    body('category')
      .optional()
      .isIn(['product_image', 'logo', 'document', 'avatar', 'other'])
      .withMessage('Invalid category'),
    
    body('entityType')
      .optional()
      .trim(),
    
    body('entityId')
      .optional()
      .custom((value) => {
        if (value && !isValidObjectId(value)) {
          throw new Error('Invalid entity ID');
        }
        return true;
      }),
    
    validate,
  ],
  fileController.uploadMultiple
);

/**
 * DELETE /api/files/:id
 * Delete file
 */
router.delete(
  '/:id',
  [
    param('id')
      .custom((value) => {
        if (!isValidObjectId(value)) {
          throw new Error('Invalid file ID');
        }
        return true;
      }),
    validate,
  ],
  fileController.delete
);

export default router;

