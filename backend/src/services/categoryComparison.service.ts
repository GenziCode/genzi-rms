import { getTenantConnection } from '../config/database';
import { CategorySchema, ICategory } from '../models/category.model';
import { ProductSchema } from '../models/product.model';
import { SaleSchema } from '../models/sale.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export class CategoryComparisonService {
  private async getModels(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return {
      Category: connection.model<ICategory>('Category', CategorySchema),
      Product: connection.model('Product', ProductSchema),
      Sale: connection.model('Sale', SaleSchema),
    };
  }

  /**
   * Compare multiple categories side-by-side
   */
  async compareCategories(tenantId: string, categoryIds: string[]): Promise<any> {
    if (categoryIds.length < 2 || categoryIds.length > 4) {
      throw new AppError('Please select between 2 and 4 categories to compare.', 400);
    }

    try {
      const { Category, Product, Sale } = await this.getModels(tenantId);
      const categories = await Category.find({ _id: { $in: categoryIds } });

      if (categories.length !== categoryIds.length) {
        throw new AppError('One or more categories not found.', 404);
      }

      const comparisonData = await Promise.all(
        categories.map(async (category) => {
          const productCount = await Product.countDocuments({ category: category._id });

          const salesData = await Sale.aggregate([
            { $unwind: '$items' },
            { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'productDetails' } },
            { $unwind: '$productDetails' },
            { $match: { 'productDetails.category': category._id } },
            {
              $group: {
                _id: null,
                totalSales: { $sum: '$items.quantity' },
                totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
              },
            },
          ]);
          
          return {
            ...category.toObject(),
            productCount,
            totalSales: salesData.length > 0 ? salesData[0].totalSales : 0,
            totalRevenue: salesData.length > 0 ? salesData[0].totalRevenue : 0,
          };
        })
      );

      return comparisonData;
    } catch (error) {
      logger.error('Error comparing categories:', error);
      throw new AppError('Failed to compare categories.', 500);
    }
  }

  /**
   * Find similar categories based on name or description
   */
  async findSimilarCategories(tenantId: string, categoryId: string): Promise<ICategory[]> {
    try {
        const { Category } = await this.getModels(tenantId);
        const targetCategory = await Category.findById(categoryId);

        if (!targetCategory) {
            throw new AppError('Target category not found.', 404);
        }

        const similarByName = await Category.find({
            _id: { $ne: categoryId },
            name: { $regex: targetCategory.name, $options: 'i' }
        }).limit(5);

        const similarByDescription = await Category.find({
            _id: { $ne: categoryId },
            description: { $regex: targetCategory.description || '', $options: 'i' }
        }).limit(5);

        const combined = [...similarByName, ...similarByDescription];
        const uniqueIds = new Set(combined.map(c => c.id));
        const uniqueSimilar = Array.from(uniqueIds).map(id => combined.find(c => c.id === id));
        
        return uniqueSimilar.slice(0, 5) as ICategory[];
    } catch (error) {
        logger.error('Error finding similar categories:', error);
        throw new AppError('Failed to find similar categories.', 500);
    }
  }
}