import { getTenantConnection } from '../config/database';
import { CategorySchema, ICategory } from '../models/category.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import { createObjectCsvStringifier } from 'csv-writer';
import * as XLSX from 'xlsx';

// Temporary service for import/export functionality
export class TempImportExportService {
  private async getCategoryModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<ICategory>('Category', CategorySchema);
  }

  async exportCategories(tenantId: string): Promise<any[]> {
    try {
      const Category = await this.getCategoryModel(tenantId);
      return await Category.find({ isActive: true }).lean();
    } catch (error) {
      logger.error('Error exporting categories:', error);
      throw error;
    }
  }

  async importCategories(tenantId: string, data: any[], userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const Category = await this.getCategoryModel(tenantId);

      for (const item of data) {
        const category = new Category({
          ...item,
          tenantId,
          createdBy: userId,
          updatedBy: userId,
        });
        await category.save();
      }

      return { success: true, message: `Imported ${data.length} categories successfully` };
    } catch (error) {
      logger.error('Error importing categories:', error);
      return { success: false, message: (error as Error).message };
    }
  }
}
