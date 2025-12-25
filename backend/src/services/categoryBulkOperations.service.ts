import { getTenantConnection } from '../config/database';
import { CategorySchema, ICategory } from '../models/category.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
  results: Array<{
    id: string;
    success: boolean;
    data?: any;
  }>;
}

export interface BulkUpdateData {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  parent?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export class CategoryBulkOperationsService {
  private async getCategoryModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<ICategory>('Category', CategorySchema);
  }

  /**
   * Bulk update categories
   */
  async bulkUpdate(
    tenantId: string,
    userId: string,
    categoryIds: string[],
    updateData: BulkUpdateData
  ): Promise<BulkOperationResult> {
    try {
      const Category = await this.getCategoryModel(tenantId);
      const results: Array<{ id: string; success: boolean; data?: any }> = [];
      const errors: Array<{ id: string; error: string }> = [];

      for (const categoryId of categoryIds) {
        try {
          // Find the category
          const category = await Category.findById(categoryId);
          if (!category) {
            errors.push({
              id: categoryId,
              error: 'Category not found'
            });
            continue;
          }

          // Check if new name conflicts with existing categories
          if (updateData.name && updateData.name !== category.name) {
            const existing = await Category.findOne({
              name: updateData.name,
              _id: { $ne: categoryId },
              isActive: true,
            });

            if (existing) {
              errors.push({
                id: categoryId,
                error: `Category with name "${updateData.name}" already exists`
              });
              continue;
            }
          }

          // Update the category with provided data
          Object.assign(category, updateData, { updatedBy: userId });
          await category.save();

          results.push({
            id: categoryId,
            success: true,
            data: category
          });
        } catch (error) {
          errors.push({
            id: categoryId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const successCount = results.length;
      const errorCount = errors.length;
      const totalProcessed = successCount + errorCount;

      logger.info(`Bulk update completed for ${totalProcessed} categories. Success: ${successCount}, Errors: ${errorCount}`);

      return {
        success: errorCount === 0,
        processed: totalProcessed,
        successCount,
        errorCount,
        errors,
        results
      };
    } catch (error) {
      logger.error('Error in bulk update:', error);
      throw error;
    }
  }

  /**
   * Bulk activate categories
   */
  async bulkActivate(
    tenantId: string,
    userId: string,
    categoryIds: string[]
  ): Promise<BulkOperationResult> {
    try {
      const Category = await this.getCategoryModel(tenantId);
      const results: Array<{ id: string; success: boolean; data?: any }> = [];
      const errors: Array<{ id: string; error: string }> = [];

      for (const categoryId of categoryIds) {
        try {
          const category = await Category.findById(categoryId);
          if (!category) {
            errors.push({
              id: categoryId,
              error: 'Category not found'
            });
            continue;
          }

          // Only update if the category is not already active
          if (!category.isActive) {
            category.isActive = true;
            category.updatedBy = userId as any;
            await category.save();
          }

          results.push({
            id: categoryId,
            success: true,
            data: category
          });
        } catch (error) {
          errors.push({
            id: categoryId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const successCount = results.length;
      const errorCount = errors.length;
      const totalProcessed = successCount + errorCount;

      logger.info(`Bulk activate completed for ${totalProcessed} categories. Success: ${successCount}, Errors: ${errorCount}`);

      return {
        success: errorCount === 0,
        processed: totalProcessed,
        successCount,
        errorCount,
        errors,
        results
      };
    } catch (error) {
      logger.error('Error in bulk activate:', error);
      throw error;
    }
  }

  /**
   * Bulk deactivate categories
   */
  async bulkDeactivate(
    tenantId: string,
    userId: string,
    categoryIds: string[]
  ): Promise<BulkOperationResult> {
    try {
      const Category = await this.getCategoryModel(tenantId);
      const results: Array<{ id: string; success: boolean; data?: any }> = [];
      const errors: Array<{ id: string; error: string }> = [];

      for (const categoryId of categoryIds) {
        try {
          const category = await Category.findById(categoryId);
          if (!category) {
            errors.push({
              id: categoryId,
              error: 'Category not found'
            });
            continue;
          }

          // Only update if the category is not already inactive
          if (category.isActive) {
            category.isActive = false;
            category.updatedBy = userId as any;
            await category.save();
          }

          results.push({
            id: categoryId,
            success: true,
            data: category
          });
        } catch (error) {
          errors.push({
            id: categoryId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const successCount = results.length;
      const errorCount = errors.length;
      const totalProcessed = successCount + errorCount;

      logger.info(`Bulk deactivate completed for ${totalProcessed} categories. Success: ${successCount}, Errors: ${errorCount}`);

      return {
        success: errorCount === 0,
        processed: totalProcessed,
        successCount,
        errorCount,
        errors,
        results
      };
    } catch (error) {
      logger.error('Error in bulk deactivate:', error);
      throw error;
    }
  }

  /**
   * Bulk delete categories (soft delete)
   */
  async bulkDelete(
    tenantId: string,
    userId: string,
    categoryIds: string[]
  ): Promise<BulkOperationResult> {
    try {
      const Category = await this.getCategoryModel(tenantId);
      const results: Array<{ id: string; success: boolean; data?: any }> = [];
      const errors: Array<{ id: string; error: string }> = [];

      for (const categoryId of categoryIds) {
        try {
          // Check if category has associated products before deletion
          const connection = await getTenantConnection(tenantId);
          const Product = connection.model('Product');
          
          const productCount = await Product.countDocuments({ category: categoryId });
          if (productCount > 0) {
            errors.push({
              id: categoryId,
              error: `Cannot delete category with ID ${categoryId}. It has ${productCount} product(s) associated with it.`
            });
            continue;
          }

          const category = await Category.findById(categoryId);
          if (!category) {
            errors.push({
              id: categoryId,
              error: 'Category not found'
            });
            continue;
          }

          // Perform soft delete by setting isActive to false
          category.isActive = false;
          category.updatedBy = userId as any;
          await category.save();

          results.push({
            id: categoryId,
            success: true,
            data: category
          });
        } catch (error) {
          errors.push({
            id: categoryId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const successCount = results.length;
      const errorCount = errors.length;
      const totalProcessed = successCount + errorCount;

      logger.info(`Bulk delete completed for ${totalProcessed} categories. Success: ${successCount}, Errors: ${errorCount}`);

      return {
        success: errorCount === 0,
        processed: totalProcessed,
        successCount,
        errorCount,
        errors,
        results
      };
    } catch (error) {
      logger.error('Error in bulk delete:', error);
      throw error;
    }
  }

  /**
   * Bulk assign parent to categories
   */
  async bulkAssignParent(
    tenantId: string,
    userId: string,
    categoryIds: string[],
    parentId: string
  ): Promise<BulkOperationResult> {
    try {
      const Category = await this.getCategoryModel(tenantId);
      const results: Array<{ id: string; success: boolean; data?: any }> = [];
      const errors: Array<{ id: string; error: string }> = [];

      // Verify that the parent category exists
      const parentCategory = await Category.findById(parentId);
      if (!parentCategory) {
        throw new AppError('Parent category not found', 404);
      }

      for (const categoryId of categoryIds) {
        // Skip if trying to assign a category as its own parent
        if (categoryId === parentId) {
          errors.push({
            id: categoryId,
            error: 'Cannot assign a category as its own parent'
          });
          continue;
        }

        try {
          const category = await Category.findById(categoryId);
          if (!category) {
            errors.push({
              id: categoryId,
              error: 'Category not found'
            });
            continue;
          }

          // Update parent assignment
          category.parent = parentId as any;
          category.updatedBy = userId as any;
          await category.save();

          results.push({
            id: categoryId,
            success: true,
            data: category
          });
        } catch (error) {
          errors.push({
            id: categoryId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const successCount = results.length;
      const errorCount = errors.length;
      const totalProcessed = successCount + errorCount;

      logger.info(`Bulk assign parent completed for ${totalProcessed} categories. Success: ${successCount}, Errors: ${errorCount}`);

      return {
        success: errorCount === 0,
        processed: totalProcessed,
        successCount,
        errorCount,
        errors,
        results
      };
    } catch (error) {
      logger.error('Error in bulk assign parent:', error);
      throw error;
    }
  }

  /**
   * Bulk update sort order
   */
  async bulkUpdateSortOrder(
    tenantId: string,
    userId: string,
    updates: Array<{ id: string; sortOrder: number }>
  ): Promise<BulkOperationResult> {
    try {
      const Category = await this.getCategoryModel(tenantId);
      const results: Array<{ id: string; success: boolean; data?: any }> = [];
      const errors: Array<{ id: string; error: string }> = [];

      for (const update of updates) {
        try {
          const category = await Category.findById(update.id);
          if (!category) {
            errors.push({
              id: update.id,
              error: 'Category not found'
            });
            continue;
          }

          // Update sort order
          category.sortOrder = update.sortOrder;
          category.updatedBy = userId as any;
          await category.save();

          results.push({
            id: update.id,
            success: true,
            data: category
          });
        } catch (error) {
          errors.push({
            id: update.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const successCount = results.length;
      const errorCount = errors.length;
      const totalProcessed = successCount + errorCount;

      logger.info(`Bulk update sort order completed for ${totalProcessed} categories. Success: ${successCount}, Errors: ${errorCount}`);

      return {
        success: errorCount === 0,
        processed: totalProcessed,
        successCount,
        errorCount,
        errors,
        results
      };
    } catch (error) {
      logger.error('Error in bulk update sort order:', error);
      throw error;
    }
  }

  /**
   * Bulk assign color and icon
   */
  async bulkAssignColorAndIcon(
    tenantId: string,
    userId: string,
    categoryIds: string[],
    color?: string,
    icon?: string
  ): Promise<BulkOperationResult> {
    try {
      const Category = await this.getCategoryModel(tenantId);
      const results: Array<{ id: string; success: boolean; data?: any }> = [];
      const errors: Array<{ id: string; error: string }> = [];

      for (const categoryId of categoryIds) {
        try {
          const category = await Category.findById(categoryId);
          if (!category) {
            errors.push({
              id: categoryId,
              error: 'Category not found'
            });
            continue;
          }

          // Update color and/or icon if provided
          if (color) {
            category.color = color;
          }
          if (icon) {
            category.icon = icon;
          }
          
          category.updatedBy = userId as any;
          await category.save();

          results.push({
            id: categoryId,
            success: true,
            data: category
          });
        } catch (error) {
          errors.push({
            id: categoryId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const successCount = results.length;
      const errorCount = errors.length;
      const totalProcessed = successCount + errorCount;

      logger.info(`Bulk assign color/icon completed for ${totalProcessed} categories. Success: ${successCount}, Errors: ${errorCount}`);

      return {
        success: errorCount === 0,
        processed: totalProcessed,
        successCount,
        errorCount,
        errors,
        results
      };
    } catch (error) {
      logger.error('Error in bulk assign color and icon:', error);
      throw error;
    }
  }

  /**
   * Bulk select categories (helper function)
   */
  async bulkSelect(
    tenantId: string,
    categoryIds: string[]
  ): Promise<BulkOperationResult> {
    try {
      const Category = await this.getCategoryModel(tenantId);
      const results: Array<{ id: string; success: boolean; data?: any }> = [];
      const errors: Array<{ id: string; error: string }> = [];

      for (const categoryId of categoryIds) {
        try {
          const category = await Category.findById(categoryId);
          if (!category) {
            errors.push({
              id: categoryId,
              error: 'Category not found'
            });
            continue;
          }

          results.push({
            id: categoryId,
            success: true,
            data: category
          });
        } catch (error) {
          errors.push({
            id: categoryId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const successCount = results.length;
      const errorCount = errors.length;
      const totalProcessed = successCount + errorCount;

      logger.info(`Bulk select completed for ${totalProcessed} categories. Success: ${successCount}, Errors: ${errorCount}`);

      return {
        success: errorCount === 0,
        processed: totalProcessed,
        successCount,
        errorCount,
        errors,
        results
      };
    } catch (error) {
      logger.error('Error in bulk select:', error);
      throw error;
    }
  }
}