import { getTenantConnection } from '../config/database';
import { CategoryTemplateSchema, ICategoryTemplate } from '../models/categoryTemplate.model';
import { CategorySchema, ICategory } from '../models/category.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export class CategoryTemplateService {
  public async getCategoryTemplateModel(tenantId: string): Promise<any> {
    const connection = await getTenantConnection(tenantId);
    return connection.model<ICategoryTemplate>('CategoryTemplate', CategoryTemplateSchema);
  }

  /**
   * Create a new category template
   */
  async createTemplate(
    tenantId: string,
    userId: string,
    data: {
      name: string;
      description?: string;
      categoryStructure: any[];
      isPublic?: boolean;
      tags?: string[];
    }
  ): Promise<ICategoryTemplate> {
    try {
      const CategoryTemplate = await this.getCategoryTemplateModel(tenantId);

      // Check if template name already exists for this tenant (if not public)
      if (!data.isPublic) {
        const existing = await CategoryTemplate.findOne({
          name: data.name,
          tenantId,
        });
        if (existing) {
          throw new AppError('Template with this name already exists for your tenant', 409);
        }
      }

      const template = new CategoryTemplate({
        ...data,
        tenantId: data.isPublic ? undefined : tenantId,
        createdBy: userId,
        updatedBy: userId,
      });

      await template.save();

      logger.info(`Category template created: ${template.name} (${template._id})`);
      return template;
    } catch (error) {
      logger.error('Error creating category template:', error);
      throw error;
    }
  }

  /**
   * Get all category templates available to the tenant
   */
  async getTemplates(
    tenantId: string,
    options: {
      includePublic?: boolean;
      search?: string;
      tags?: string[];
    } = {}
  ): Promise<ICategoryTemplate[]> {
    try {
      const CategoryTemplate = await this.getCategoryTemplateModel(tenantId);

      const { includePublic = true, search = '', tags = [] } = options;

      // Build query
      const query: any = {};
      if (includePublic) {
        query.$or = [
          { tenantId },
          { isPublic: true }
        ];
      } else {
        query.tenantId = tenantId;
      }

      if (search) {
        query.$or = query.$or || [];
        query.$or.push(
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        );
      }

      if (tags.length > 0) {
        query.tags = { $in: tags };
      }

      const templates = await CategoryTemplate.find(query).sort({ createdAt: -1 });

      return templates;
    } catch (error) {
      logger.error('Error getting category templates:', error);
      throw error;
    }
  }

  /**
   * Get category template by ID
   */
  async getTemplateById(
    tenantId: string,
    templateId: string
  ): Promise<ICategoryTemplate> {
    try {
      const CategoryTemplate = await this.getCategoryTemplateModel(tenantId);

      const template = await CategoryTemplate.findOne({
        $or: [
          { _id: templateId, tenantId },
          { _id: templateId, isPublic: true }
        ]
      });

      if (!template) {
        throw new AppError('Template not found or access denied', 404);
      }

      return template;
    } catch (error) {
      logger.error('Error getting category template:', error);
      throw error;
    }
  }

  /**
   * Update category template
   */
  async updateTemplate(
    tenantId: string,
    templateId: string,
    userId: string,
    data: Partial<{
      name: string;
      description: string;
      categoryStructure: any[];
      isPublic: boolean;
      tags: string[];
    }>
  ): Promise<ICategoryTemplate> {
    try {
      const CategoryTemplate = await this.getCategoryTemplateModel(tenantId);

      const template = await CategoryTemplate.findOne({
        _id: templateId,
        tenantId,
      });

      if (!template) {
        throw new AppError('Template not found or access denied', 404);
      }

      // Update fields
      Object.assign(template, data, { updatedBy: userId });

      await template.save();

      logger.info(`Category template updated: ${template.name} (${template._id})`);
      return template;
    } catch (error) {
      logger.error('Error updating category template:', error);
      throw error;
    }
  }

  /**
   * Delete category template
   */
  async deleteTemplate(
    tenantId: string,
    templateId: string,
    userId: string
  ): Promise<void> {
    try {
      const CategoryTemplate = await this.getCategoryTemplateModel(tenantId);

      const template = await CategoryTemplate.findOneAndDelete({
        _id: templateId,
        tenantId,
      });

      if (!template) {
        throw new AppError('Template not found or access denied', 404);
      }

      logger.info(`Category template deleted: ${template.name} (${template._id})`);
    } catch (error) {
      logger.error('Error deleting category template:', error);
      throw error;
    }
  }

  /**
   * Apply template to create categories
   */
  async applyTemplate(
    tenantId: string,
    templateId: string,
    userId: string,
    options: {
      prefix?: string;
      parentCategoryId?: string;
    } = {}
  ): Promise<ICategory[]> {
    try {
      const CategoryTemplate = await this.getCategoryTemplateModel(tenantId);
      const Category = (await getTenantConnection(tenantId)).model<ICategory>('Category', CategorySchema);

      const { prefix = '', parentCategoryId } = options;

      // Get the template
      const template = await CategoryTemplate.findById(templateId);
      if (!template) {
        throw new AppError('Template not found', 404);
      }

      // Check if user has access to this template
      if (!template.isPublic && template.tenantId.toString() !== tenantId) {
        throw new AppError('Template not found or access denied', 404);
      }

      // Increment usage count
      template.usageCount = (template.usageCount || 0) + 1;
      await template.save();

      const createdCategories: ICategory[] = [];

      // Process each category in the template structure
      for (const catData of template.categoryStructure) {
        const categoryName = prefix ? `${prefix} ${catData.name}` : catData.name;

        // Check if category with this name already exists
        const existing = await Category.findOne({
          name: categoryName,
          isActive: true,
        });
        if (existing) {
          throw new AppError(`Category with name "${categoryName}" already exists`, 409);
        }

        // Create the main category
        const category = new Category({
          name: categoryName,
          description: catData.description,
          color: catData.color,
          icon: catData.icon,
          sortOrder: catData.sortOrder,
          parent: parentCategoryId,
          createdBy: userId,
          updatedBy: userId,
        });

        await category.save();
        createdCategories.push(category);

        // Process children if any
        if (catData.children && catData.children.length > 0) {
          for (const childData of catData.children) {
            const childCategoryName = prefix ? `${prefix} ${childData.name}` : childData.name;

            // Check if child category already exists
            const existingChild = await Category.findOne({
              name: childCategoryName,
              parent: category._id,
              isActive: true,
            });
            if (existingChild) {
              throw new AppError(`Child category with name "${childCategoryName}" already exists under "${categoryName}"`, 409);
            }

            const childCategory = new Category({
              name: childCategoryName,
              description: childData.description,
              color: childData.color,
              icon: childData.icon,
              sortOrder: childData.sortOrder,
              parent: category._id,
              createdBy: userId,
              updatedBy: userId,
            });

            await childCategory.save();
            createdCategories.push(childCategory);
          }
        }
      }

      logger.info(`Template applied: ${template.name} - ${createdCategories.length} categories created`);
      return createdCategories;
    } catch (error) {
      logger.error('Error applying category template:', error);
      throw error;
    }
  }

  /**
   * Save existing category structure as template
   */
  async saveCategoryAsTemplate(
    tenantId: string,
    userId: string,
    categoryId: string,
    templateName: string,
    description?: string,
    tags?: string[]
  ): Promise<ICategoryTemplate> {
    try {
      const Category = (await getTenantConnection(tenantId)).model<ICategory>('Category', CategorySchema);
      const CategoryTemplate = await this.getCategoryTemplateModel(tenantId);

      // Get the source category
      const sourceCategory = await Category.findById(categoryId);
      if (!sourceCategory) {
        throw new AppError('Source category not found', 404);
      }

      // Get all children of this category
      const children = await Category.find({ parent: categoryId, isActive: true });

      // Create the template structure
      const categoryStructure = [{
        name: sourceCategory.name,
        description: sourceCategory.description,
        color: sourceCategory.color,
        icon: sourceCategory.icon,
        sortOrder: sourceCategory.sortOrder,
        children: children.map(child => ({
          name: child.name,
          description: child.description,
          color: child.color,
          icon: child.icon,
          sortOrder: child.sortOrder,
        }))
      }];

      // Create the template
      const template = new CategoryTemplate({
        name: templateName,
        description,
        categoryStructure,
        tags: tags || [],
        createdBy: userId,
        updatedBy: userId,
      });

      await template.save();

      logger.info(`Category saved as template: ${template.name} (${template._id})`);
      return template;
    } catch (error) {
      logger.error('Error saving category as template:', error);
      throw error;
    }
  }
}
