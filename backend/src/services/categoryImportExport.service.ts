import { getTenantConnection } from '../config/database';
import { CategorySchema, ICategory } from '../models/category.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import { createObjectCsvStringifier } from 'csv-writer';
import * as XLSX from 'xlsx';

export class CategoryImportExportService {
  private async getCategoryModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<ICategory>('Category', CategorySchema);
  }

  async exportCategories(tenantId: string, format: 'csv' | 'excel' = 'csv'): Promise<Buffer> {
    try {
      const Category = await this.getCategoryModel(tenantId);
      const categories = await Category.find({ isActive: true }).lean();

      if (format === 'csv') {
        return this.exportToCSV(categories);
      } else {
        return this.exportToExcel(categories);
      }
    } catch (error) {
      logger.error('Error exporting categories:', error);
      throw error;
    }
  }

  private exportToCSV(categories: any[]): Buffer {
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'name', title: 'Name' },
        { id: 'description', title: 'Description' },
        { id: 'color', title: 'Color' },
        { id: 'icon', title: 'Icon' },
        { id: 'sortOrder', title: 'Sort Order' },
        { id: 'isActive', title: 'Active' },
      ],
    });

    const csvData = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(categories);
    return Buffer.from(csvData, 'utf-8');
  }

  private exportToExcel(categories: any[]): Buffer {
    const worksheet = XLSX.utils.json_to_sheet(categories);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Categories');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async importCategories(tenantId: string, data: any[], userId: string): Promise<{ imported: number; failed: number; errors: string[] }> {
    try {
      const Category = await this.getCategoryModel(tenantId);
      let imported = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const item of data) {
        try {
          const category = new Category({
            ...item,
            tenantId,
            createdBy: userId,
            updatedBy: userId,
          });
          await category.save();
          imported++;
        } catch (error: any) {
          failed++;
          errors.push(`Row ${data.indexOf(item) + 1}: ${error.message}`);
        }
      }

      logger.info(`Imported ${imported} categories, failed ${failed}`);
      return { imported, failed, errors };
    } catch (error) {
      logger.error('Error importing categories:', error);
      throw error;
    }
  }
}
