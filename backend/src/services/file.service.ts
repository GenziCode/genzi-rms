import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { getTenantConnection } from '../config/database';
import { FileSchema, IFile } from '../models/file.model';
import { NotFoundError, ForbiddenError } from '../utils/appError';
import { logger } from '../utils/logger';

export class FileService {
  /**
   * Save file metadata to database
   */
  async createFileRecord(
    tenantId: string,
    userId: string,
    file: Express.Multer.File,
    category: 'product_image' | 'logo' | 'document' | 'avatar' | 'other' = 'other',
    entityType?: string,
    entityId?: string
  ): Promise<IFile> {
    const tenantConn = await getTenantConnection(tenantId);
    const File = tenantConn.model<IFile>('File', FileSchema);

    // Generate public URL
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const url = `${baseUrl}/uploads/${file.filename}`;

    // Process image metadata if it's an image
    const metadata: Record<string, unknown> = {};
    if (file.mimetype.startsWith('image/')) {
      try {
        const imageMetadata = await sharp(file.path).metadata();
        metadata.width = imageMetadata.width;
        metadata.height = imageMetadata.height;

        // Generate thumbnail for images
        if (category === 'product_image' || category === 'logo' || category === 'avatar') {
          const thumbnailPath = file.path.replace(
            path.extname(file.filename),
            '-thumb' + path.extname(file.filename)
          );
          await sharp(file.path)
            .resize(200, 200, { fit: 'cover' })
            .toFile(thumbnailPath);
          
          metadata.thumbnailUrl = `${baseUrl}/uploads/${path.basename(thumbnailPath)}`;
        }
      } catch (error) {
        logger.warn(`Failed to process image metadata for ${file.filename}:`, error);
      }
    }

    const fileRecord = new File({
      tenantId,
      filename: file.originalname,
      storedFilename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      url,
      category,
      entityType,
      entityId,
      uploadedBy: userId,
      metadata,
    });

    await fileRecord.save();

    logger.info(`File record created: ${file.filename} for tenant: ${tenantId}`);

    return fileRecord;
  }

  /**
   * Get all files with filters
   */
  async getAll(
    tenantId: string,
    filters: {
      category?: string;
      entityType?: string;
      entityId?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    files: IFile[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const tenantConn = await getTenantConnection(tenantId);
    const File = tenantConn.model<IFile>('File', FileSchema);

    const query: any = { tenantId };

    if (filters.category) query.category = filters.category;
    if (filters.entityType) query.entityType = filters.entityType;
    if (filters.entityId) query.entityId = filters.entityId;

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const [files, total] = await Promise.all([
      File.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'firstName lastName email')
        .lean(),
      File.countDocuments(query),
    ]);

    return {
      files,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get file by ID
   */
  async getById(tenantId: string, fileId: string): Promise<IFile> {
    const tenantConn = await getTenantConnection(tenantId);
    const File = tenantConn.model<IFile>('File', FileSchema);

    const file = await File.findOne({ _id: fileId, tenantId });

    if (!file) {
      throw new NotFoundError('File');
    }

    return file;
  }

  /**
   * Delete file
   */
  async delete(tenantId: string, fileId: string, userId: string): Promise<void> {
    const tenantConn = await getTenantConnection(tenantId);
    const File = tenantConn.model<IFile>('File', FileSchema);

    const file = await File.findOne({ _id: fileId, tenantId });

    if (!file) {
      throw new NotFoundError('File');
    }

    // Optional: Check if user has permission to delete
    // For now, any authenticated user can delete files from their tenant

    // Delete physical file
    try {
      await fs.unlink(file.path);
      
      // Delete thumbnail if exists
      if (file.metadata?.thumbnailUrl) {
        const thumbnailPath = file.path.replace(
          path.extname(file.storedFilename),
          '-thumb' + path.extname(file.storedFilename)
        );
        try {
          await fs.unlink(thumbnailPath);
        } catch (error) {
          logger.warn(`Failed to delete thumbnail: ${thumbnailPath}`);
        }
      }
    } catch (error) {
      logger.error(`Failed to delete physical file: ${file.path}`, error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete database record
    await File.deleteOne({ _id: fileId });

    logger.info(`File deleted: ${file.filename} by user: ${userId}`);
  }

  /**
   * Add product image
   */
  async addProductImage(
    tenantId: string,
    productId: string,
    fileId: string
  ): Promise<void> {
    const tenantConn = await getTenantConnection(tenantId);
    const Product = tenantConn.model('Product');
    const File = tenantConn.model<IFile>('File', FileSchema);

    const [product, file] = await Promise.all([
      Product.findOne({ _id: productId, tenantId }),
      File.findOne({ _id: fileId, tenantId }),
    ]);

    if (!product) {
      throw new NotFoundError('Product');
    }

    if (!file) {
      throw new NotFoundError('File');
    }

    // Update file record with entity info
    file.entityType = 'Product';
    file.entityId = productId as any;
    file.category = 'product_image';
    await file.save();

    // Add URL to product images array
    if (!product.images) {
      product.images = [];
    }
    
    product.images.push(file.url);
    await product.save();

    logger.info(`Image added to product: ${productId} - ${file.url}`);
  }

  /**
   * Remove product image
   */
  async removeProductImage(
    tenantId: string,
    productId: string,
    imageIndex: number
  ): Promise<void> {
    const tenantConn = await getTenantConnection(tenantId);
    const Product = tenantConn.model('Product');

    const product = await Product.findOne({ _id: productId, tenantId });

    if (!product) {
      throw new NotFoundError('Product');
    }

    if (!product.images || imageIndex >= product.images.length || imageIndex < 0) {
      throw new NotFoundError('Image');
    }

    // Remove image URL from array
    const imageUrl = product.images[imageIndex];
    product.images.splice(imageIndex, 1);
    await product.save();

    // Optional: Delete file from storage (if not used elsewhere)
    // For now, we'll keep the file in storage

    logger.info(`Image removed from product: ${productId} - Index: ${imageIndex}`);
  }

  /**
   * Get file statistics
   */
  async getStatistics(tenantId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    byCategory: Array<{ category: string; count: number; size: number }>;
  }> {
    const tenantConn = await getTenantConnection(tenantId);
    const File = tenantConn.model<IFile>('File', FileSchema);

    const stats = await File.aggregate([
      { $match: { tenantId: tenantId as any } },
      {
        $group: {
          _id: null,
          totalFiles: { $sum: 1 },
          totalSize: { $sum: '$size' },
        },
      },
    ]);

    const byCategory = await File.aggregate([
      { $match: { tenantId: tenantId as any } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          size: { $sum: '$size' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return {
      totalFiles: stats[0]?.totalFiles || 0,
      totalSize: stats[0]?.totalSize || 0,
      byCategory: byCategory.map((cat) => ({
        category: cat._id,
        count: cat.count,
        size: cat.size,
      })),
    };
  }
}

export const fileService = new FileService();

