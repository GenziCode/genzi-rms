import { Connection } from 'mongoose';
import { getTenantConnection } from '../config/database';
import { CategorySchema, ICategory } from '../models/category.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export class CategoryService {
  private async getCategoryModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<ICategory>('Category', CategorySchema);
  }

  /**
   * Create a new category
   */
  async createCategory(
    tenantId: string,
    userId: string,
    data: {
      name: string;
      description?: string;
      color?: string;
      icon?: string;
      sortOrder?: number;
    }
  ): Promise<ICategory> {
    try {
      const Category = await this.getCategoryModel(tenantId);

      // Check if category name already exists
      const existing = await Category.findOne({
        name: data.name,
        isActive: true,
      });

      if (existing) {
        throw new AppError('Category with this name already exists', 409);
      }

      // If no sort order provided, set it to the end
      if (data.sortOrder === undefined) {
        const maxOrder = await Category.findOne()
          .sort('-sortOrder')
          .select('sortOrder');
        data.sortOrder = maxOrder ? maxOrder.sortOrder + 1 : 1;
      }

      const category = new Category({
        ...data,
        createdBy: userId,
        updatedBy: userId,
      });

      await category.save();

      logger.info(`Category created: ${category.name} (${category._id})`);
      return category;
    } catch (error) {
      logger.error('Error creating category:', error);
      throw error;
    }
  }

  /**
   * Get all categories
   */
  async getCategories(
    tenantId: string,
    options: {
      includeInactive?: boolean;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    categories: ICategory[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const Category = await this.getCategoryModel(tenantId);

      const {
        includeInactive = false,
        search = '',
        sortBy = 'sortOrder',
        sortOrder = 'asc',
        page = 1,
        limit = 50,
      } = options;

      // Build query
      const query: any = {};
      if (!includeInactive) {
        query.isActive = true;
      }
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      // Count total
      const total = await Category.countDocuments(query);

      // Build sort
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Get categories  
      const categories = await Category.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit);

      return {
        categories,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error getting categories:', error);
      throw error;
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(
    tenantId: string,
    categoryId: string
  ): Promise<ICategory> {
    try {
      const Category = await this.getCategoryModel(tenantId);

      const category = await Category.findById(categoryId);

      if (!category) {
        throw new AppError('Category not found', 404);
      }

      return category;
    } catch (error) {
      logger.error('Error getting category:', error);
      throw error;
    }
  }

  /**
   * Update category
   */
  async updateCategory(
    tenantId: string,
    categoryId: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      color?: string;
      icon?: string;
      sortOrder?: number;
      isActive?: boolean;
    }
  ): Promise<ICategory> {
    try {
      const Category = await this.getCategoryModel(tenantId);

      const category = await Category.findById(categoryId);
      if (!category) {
        throw new AppError('Category not found', 404);
      }

      // Check if new name conflicts with existing
      if (data.name && data.name !== category.name) {
        const existing = await Category.findOne({
          name: data.name,
          _id: { $ne: categoryId },
          isActive: true,
        });

        if (existing) {
          throw new AppError('Category with this name already exists', 409);
        }
      }

      // Update fields
      Object.assign(category, data, { updatedBy: userId });

      await category.save();

      logger.info(`Category updated: ${category.name} (${category._id})`);
      return category;
    } catch (error) {
      logger.error('Error updating category:', error);
      throw error;
    }
  }

  /**
   * Delete category (soft delete)
   */
  async deleteCategory(
    tenantId: string,
    categoryId: string,
    userId: string
  ): Promise<void> {
    try {
      const Category = await this.getCategoryModel(tenantId);

      const category = await Category.findById(categoryId);
      if (!category) {
        throw new AppError('Category not found', 404);
      }

      // Check if category has products
      const connection = await getTenantConnection(tenantId);
      const Product = connection.model('Product');
      const productCount = await Product.countDocuments({
        category: categoryId,
      });

      if (productCount > 0) {
        throw new AppError(
          `Cannot delete category. It has ${productCount} product(s) assigned to it.`,
          409
        );
      }

      // Soft delete
      category.isActive = false;
      category.updatedBy = userId as any;
      await category.save();

      logger.info(`Category deleted: ${category.name} (${category._id})`);
    } catch (error) {
      logger.error('Error deleting category:', error);
      throw error;
    }
  }

  /**
   * Bulk update sort order
   */
  async updateSortOrder(
    tenantId: string,
    userId: string,
    updates: Array<{ id: string; sortOrder: number }>
  ): Promise<void> {
    try {
      const Category = await this.getCategoryModel(tenantId);

      const bulkOps = updates.map((update) => ({
        updateOne: {
          filter: { _id: update.id },
          update: {
            $set: {
              sortOrder: update.sortOrder,
              updatedBy: userId,
            },
          },
        },
      }));

      await Category.bulkWrite(bulkOps);

      logger.info(
        `Category sort order updated for ${updates.length} categories`
      );
    } catch (error) {
      logger.error('Error updating category sort order:', error);
      throw error;
    }
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(tenantId: string): Promise<any> {
    try {
      const Category = await this.getCategoryModel(tenantId);
      const connection = await getTenantConnection(tenantId);
      const Product = connection.model('Product');

      const categories = await Category.find({ isActive: true });

      const stats = await Promise.all(
        categories.map(async (category) => {
          const productCount = await Product.countDocuments({
            category: category._id,
          });

          return {
            id: category._id,
            name: category.name,
            productCount,
            color: category.color,
            icon: category.icon,
          };
        })
      );

      return stats;
    } catch (error) {
      logger.error('Error getting category stats:', error);
      throw error;
    }
  }
}

