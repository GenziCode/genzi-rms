import { Response, NextFunction } from 'express';
import { TenantRequest } from '../types';
import { fileService } from '../services/file.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export class FileController {
  /**
   * Upload single file
   * POST /api/files/upload
   */
  uploadFile = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    const { category, entityType, entityId } = req.body;

    const file = await fileService.createFileRecord(
      tenantId,
      userId,
      req.file!,
      category,
      entityType,
      entityId
    );

    sendSuccess(res, { file }, 'File uploaded successfully', 201);
  });

  /**
   * Upload multiple files
   * POST /api/files/upload-multiple
   */
  uploadMultiple = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    const { category, entityType, entityId } = req.body;

    const uploadedFiles = req.files as Express.Multer.File[];

    const files = await Promise.all(
      uploadedFiles.map((file) =>
        fileService.createFileRecord(tenantId, userId, file, category, entityType, entityId)
      )
    );

    sendSuccess(res, { files, count: files.length }, 'Files uploaded successfully', 201);
  });

  /**
   * Get all files
   * GET /api/files
   */
  getAll = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const { category, entityType, entityId, page, limit } = req.query;

    const filters = {
      category: category as string,
      entityType: entityType as string,
      entityId: entityId as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    };

    const result = await fileService.getAll(tenantId, filters);

    sendSuccess(res, result, 'Files retrieved successfully');
  });

  /**
   * Get file by ID
   * GET /api/files/:id
   */
  getById = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const file = await fileService.getById(tenantId, id);

    sendSuccess(res, { file }, 'File retrieved successfully');
  });

  /**
   * Delete file
   * DELETE /api/files/:id
   */
  delete = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    const { id } = req.params;

    await fileService.delete(tenantId, id, userId);

    sendSuccess(res, null, 'File deleted successfully');
  });

  /**
   * Get file statistics
   * GET /api/files/statistics
   */
  getStatistics = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;

    const stats = await fileService.getStatistics(tenantId);

    sendSuccess(res, stats, 'File statistics retrieved successfully');
  });

  /**
   * Add product image
   * POST /api/products/:id/images
   */
  addProductImage = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    const { id: productId } = req.params;

    // Create file record
    const file = await fileService.createFileRecord(
      tenantId,
      userId,
      req.file!,
      'product_image',
      'Product',
      productId
    );

    // Add to product
    await fileService.addProductImage(tenantId, productId, file._id.toString());

    sendSuccess(res, { file }, 'Product image uploaded successfully', 201);
  });

  /**
   * Delete product image
   * DELETE /api/products/:id/images/:index
   */
  deleteProductImage = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const { id: productId, index } = req.params;

    await fileService.removeProductImage(tenantId, productId, parseInt(index));

    sendSuccess(res, null, 'Product image deleted successfully');
  });
}

export const fileController = new FileController();

