import { getTenantConnection } from '../config/database';
import { Types } from 'mongoose';
import { CategoryTagSchema, ICategoryTag } from '../models/categoryTag.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export class CategoryTagService {
  public async getCategoryTagModel(tenantId: string): Promise<any> {
    const connection = await getTenantConnection(tenantId);
    return connection.model<ICategoryTag>('CategoryTag', CategoryTagSchema);
  }

  /**
   * Create a new category tag
   */
  async createTag(
    tenantId: string,
    userId: string,
    data: {
      name: string;
      description?: string;
      color: string;
      icon?: string;
    }
  ): Promise<ICategoryTag> {
    try {
      const CategoryTag = await this.getCategoryTagModel(tenantId);

      // Check if tag name already exists for this tenant
      const existing = await CategoryTag.findOne({
        name: data.name,
        tenantId,
        isActive: true,
      });

      if (existing) {
        throw new AppError('Tag with this name already exists', 409);
      }

      const tag = new CategoryTag({
        ...data,
        tenantId,
        createdBy: userId,
        updatedBy: userId,
      });

      await tag.save();

      logger.info(`Category tag created: ${tag.name} (${tag._id})`);
      return tag;
    } catch (error) {
      logger.error('Error creating category tag:', error);
      throw error;
    }
  }

  /**
   * Get all category tags for a tenant
   */
  async getTags(
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
    tags: ICategoryTag[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const CategoryTag = await this.getCategoryTagModel(tenantId);

      const {
        includeInactive = false,
        search = '',
        sortBy = 'name',
        sortOrder = 'asc',
        page = 1,
        limit = 50,
      } = options;

      // Build query
      const query: any = { tenantId };
      if (!includeInactive) {
        query.isActive = true;
      }
      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }

      // Count total
      const total = await CategoryTag.countDocuments(query);

      // Build sort
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Get tags
      const tags = await CategoryTag.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit);

      return {
        tags,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error getting category tags:', error);
      throw error;
    }
  }

  /**
   * Get tag by ID
   */
  async getTagById(
    tenantId: string,
    tagId: string
  ): Promise<ICategoryTag> {
    try {
      const CategoryTag = await this.getCategoryTagModel(tenantId);

      const tag = await CategoryTag.findOne({
        _id: tagId,
        tenantId,
      });

      if (!tag) {
        throw new AppError('Tag not found', 404);
      }

      return tag;
    } catch (error) {
      logger.error('Error getting category tag:', error);
      throw error;
    }
  }

  /**
   * Update category tag
   */
  async updateTag(
    tenantId: string,
    tagId: string,
    userId: string,
    data: Partial<{
      name: string;
      description: string;
      color: string;
      icon: string;
      isActive: boolean;
    }>
  ): Promise<ICategoryTag> {
    try {
      const CategoryTag = await this.getCategoryTagModel(tenantId);

      const tag = await CategoryTag.findOne({
        _id: tagId,
        tenantId,
      });

      if (!tag) {
        throw new AppError('Tag not found', 404);
      }

      // Check if new name conflicts with existing
      if (data.name && data.name !== tag.name) {
        const existing = await CategoryTag.findOne({
          name: data.name,
          tenantId,
          _id: { $ne: tagId },
          isActive: true,
        });

        if (existing) {
          throw new AppError('Tag with this name already exists', 409);
        }
      }

      // Update fields
      Object.assign(tag, data, { updatedBy: userId });

      await tag.save();

      logger.info(`Category tag updated: ${tag.name} (${tag._id})`);
      return tag;
    } catch (error) {
      logger.error('Error updating category tag:', error);
      throw error;
    }
  }

  /**
   * Delete category tag (soft delete)
   */
  async deleteTag(
    tenantId: string,
    tagId: string,
    userId: string
  ): Promise<void> {
    try {
      const CategoryTag = await this.getCategoryTagModel(tenantId);

      const tag = await CategoryTag.findOne({
        _id: tagId,
        tenantId,
      });

      if (!tag) {
        throw new AppError('Tag not found', 404);
      }

      // Soft delete
      tag.isActive = false;
      tag.updatedBy = userId as any;
      await tag.save();

      logger.info(`Category tag deleted: ${tag.name} (${tag._id})`);
    } catch (error) {
      logger.error('Error deleting category tag:', error);
      throw error;
    }
  }

  /**
   * Assign tags to a category
   */
  async assignTagsToCategory(
    tenantId: string,
    categoryId: string,
    userId: string,
    tagIds: string[]
  ): Promise<void> {
    try {
      const Category = (await getTenantConnection(tenantId)).model('Category');
      const CategoryTag = await this.getCategoryTagModel(tenantId);

      // Validate that tags exist and belong to tenant
      const tags = await CategoryTag.find({
        _id: { $in: tagIds },
        tenantId,
        isActive: true,
      });

      if (tags.length !== tagIds.length) {
        throw new AppError('One or more tags not found', 404);
      }

      // Update category with tags
      await Category.findByIdAndUpdate(
        categoryId,
        {
          $addToSet: { tags: { $each: tagIds.map(id => new Types.ObjectId(id)) } },
          $set: { updatedBy: userId },
        },
        { new: true }
      );

      logger.info(`Tags assigned to category ${categoryId}: ${tagIds.join(', ')}`);
    } catch (error) {
      logger.error('Error assigning tags to category:', error);
      throw error;
    }
  }

  /**
   * Remove tags from a category
   */
  async removeTagsFromCategory(
    tenantId: string,
    categoryId: string,
    userId: string,
    tagIds: string[]
  ): Promise<void> {
    try {
      const Category = (await getTenantConnection(tenantId)).model('Category');

      await Category.findByIdAndUpdate(
        categoryId,
        {
          $pull: { tags: { $in: tagIds } },
          $set: { updatedBy: userId },
        }
      );

      logger.info(`Tags removed from category ${categoryId}: ${tagIds.join(', ')}`);
    } catch (error) {
      logger.error('Error removing tags from category:', error);
      throw error;
    }
  }

  /**
   * Get tags for a specific category
   */
  async getCategoryTags(
    tenantId: string,
    categoryId: string
  ): Promise<ICategoryTag[]> {
    try {
      const Category = (await getTenantConnection(tenantId)).model('Category');
      const CategoryTag = await this.getCategoryTagModel(tenantId);

      const category = await Category.findById(categoryId);
      if (!category) {
        throw new AppError('Category not found', 404);
      }

      if (!category.tags || category.tags.length === 0) {
        return [];
      }

      const tags = await CategoryTag.find({
        _id: { $in: category.tags },
        isActive: true,
      });

      return tags;
    } catch (error) {
      logger.error('Error getting category tags:', error);
      throw error;
    }
  }
}