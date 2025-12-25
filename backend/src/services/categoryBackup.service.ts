import { getTenantConnection } from '../config/database';
import { CategorySchema, ICategory } from '../models/category.model';
import { CategoryBackupSchema, ICategoryBackup } from '../models/categoryBackup.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export class CategoryBackupService {
  private async getModels(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return {
      Category: connection.model<ICategory>('Category', CategorySchema),
      CategoryBackup: connection.model<ICategoryBackup>('CategoryBackup', CategoryBackupSchema),
    };
  }

  async createBackup(tenantId: string, description?: string): Promise<ICategoryBackup> {
    try {
      const { Category, CategoryBackup } = await this.getModels(tenantId);
      const categories = await Category.find();

      const backup = new CategoryBackup({
        tenantId,
        description,
        categoryData: categories.map(c => c.toObject()),
      });

      await backup.save();
      logger.info(`Created category backup for tenant ${tenantId}`);
      return backup;
    } catch (error) {
      logger.error('Error creating category backup:', error);
      throw new AppError('Failed to create category backup', 500);
    }
  }

  async getBackups(tenantId: string): Promise<ICategoryBackup[]> {
    try {
      const { CategoryBackup } = await this.getModels(tenantId);
      return await CategoryBackup.find({ tenantId }).sort({ createdAt: -1 });
    } catch (error) {
      logger.error('Error getting category backups:', error);
      throw new AppError('Failed to retrieve category backups', 500);
    }
  }

  async restoreBackup(tenantId: string, backupId: string): Promise<void> {
    try {
      const { Category, CategoryBackup } = await this.getModels(tenantId);
      const backup = await CategoryBackup.findById(backupId);

      if (!backup || backup.tenantId.toString() !== tenantId) {
        throw new AppError('Backup not found', 404);
      }

      // This is a destructive operation, consider adding a confirmation step
      await Category.deleteMany({});
      
      // We need to handle ObjectId references correctly during restore
      const categoryData = backup.categoryData.map(c => {
        delete c._id; // Remove old _id to allow MongoDB to generate a new one
        return c;
      });

      await Category.insertMany(categoryData);
      
      logger.info(`Restored category backup ${backupId} for tenant ${tenantId}`);
    } catch (error) {
      logger.error('Error restoring category backup:', error);
      throw new AppError('Failed to restore category backup', 500);
    }
  }

  async downloadBackup(tenantId: string, backupId: string): Promise<any> {
    try {
        const { CategoryBackup } = await this.getModels(tenantId);
        const backup = await CategoryBackup.findById(backupId);

        if (!backup || backup.tenantId.toString() !== tenantId) {
            throw new AppError('Backup not found', 404);
        }

        return backup.categoryData;
    } catch (error) {
        logger.error('Error downloading category backup:', error);
        throw new AppError('Failed to download category backup', 500);
    }
  }
}