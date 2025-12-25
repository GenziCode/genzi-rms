import { getTenantConnection } from '../config/database';
import { CategorySchema, ICategory } from '../models/category.model';
import { ProductSchema } from '../models/product.model';
import { SaleSchema } from '../models/sale.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import { Connection } from 'mongoose';

export class CategoryAnalyticsService {
  private async getModels(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return {
      Category: connection.model<ICategory>('Category', CategorySchema),
      Product: connection.model('Product', ProductSchema),
      Sale: connection.model('Sale', SaleSchema),
      connection,
    };
  }

  /**
   * Get overview metrics for the category analytics dashboard
   */
  async getOverview(tenantId: string): Promise<any> {
    try {
      const { Category, Product } = await this.getModels(tenantId);

      const totalCategories = await Category.countDocuments();
      const activeCategories = await Category.countDocuments({ isActive: true });
      
      const categoriesWithProducts = await Product.distinct('category');
      
      const averageProductsPerCategory = totalCategories > 0 ? (await Product.countDocuments()) / totalCategories : 0;

      return {
        totalCategories,
        activeCategories,
        categoriesWithProducts: categoriesWithProducts.length,
        averageProductsPerCategory: parseFloat(averageProductsPerCategory.toFixed(2)),
      };
    } catch (error) {
      logger.error('Error getting category analytics overview:', error);
      throw new AppError('Failed to retrieve category analytics overview', 500);
    }
  }

  /**
   * Get category performance metrics (sales, revenue)
   */
  async getPerformance(tenantId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      const { Sale, Product, Category } = await this.getModels(tenantId);
      
      const dateQuery = startDate && endDate ? { createdAt: { $gte: startDate, $lte: endDate } } : {};

      const sales = await Sale.find(dateQuery).populate({
        path: 'items.product',
        populate: {
          path: 'category',
          model: 'Category'
        }
      });

      const categoryPerformance: { [key: string]: { sales: number; revenue: number; productCount: number } } = {};

      for (const sale of sales) {
        for (const item of sale.items) {
          if (item.product && (item.product as any).category) {
            const category = (item.product as any).category;
            const categoryId = category._id.toString();

            if (!categoryPerformance[categoryId]) {
              categoryPerformance[categoryId] = { sales: 0, revenue: 0, productCount: 0 };
            }
            categoryPerformance[categoryId].sales += item.quantity;
            categoryPerformance[categoryId].revenue += item.price * item.quantity;
          }
        }
      }
      
      const categories = await Category.find({ _id: { $in: Object.keys(categoryPerformance) } });
      
      const performanceData = await Promise.all(categories.map(async (category) => {
        const productCount = await Product.countDocuments({ category: category._id });
        return {
          ...category.toObject(),
          ...categoryPerformance[category._id.toString()],
          productCount,
        };
      }));

      return performanceData;
    } catch (error) {
      logger.error('Error getting category performance:', error);
      throw new AppError('Failed to retrieve category performance data', 500);
    }
  }
}