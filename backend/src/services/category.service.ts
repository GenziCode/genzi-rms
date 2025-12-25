import { Model, Types } from 'mongoose';
import { getTenantConnection } from '../config/database';
import { CategorySchema, ICategory } from '../models/category.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import { CategoryAuditService } from './categoryAudit.service';

export class CategoryService {
  private auditService: CategoryAuditService;

  constructor() {
    this.auditService = new CategoryAuditService();
  }
  public async getCategoryModel(tenantId: string): Promise<Model<ICategory>> {
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

      await this.auditService.logChange(tenantId, category._id.toString(), userId, 'create', [
        { field: 'all', oldValue: null, newValue: category.toObject() }
      ]);

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
      const query: Record<string, unknown> = {};
      if (!includeInactive) {
        query.isActive = true;
      }
      query.isArchived = { $ne: true };
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      // Count total
      const total = await Category.countDocuments(query);

      // Build sort
      const sort: Record<string, 1 | -1> = {};
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
      const oldCategory = category.toObject();
      Object.assign(category, data, { updatedBy: userId });

      await category.save();
      
      const changes = Object.keys(data).map(key => ({
        field: key,
        oldValue: (oldCategory as Record<string, unknown>)[key],
        newValue: (category as Record<string, unknown>)[key],
      }));
      
      await this.auditService.logChange(tenantId, categoryId, userId, 'update', changes);

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
      category.updatedBy = new Types.ObjectId(userId);
      await category.save();
      
      await this.auditService.logChange(tenantId, categoryId, userId, 'delete', [
        { field: 'isActive', oldValue: true, newValue: false }
      ]);

      logger.info(`Category deleted: ${category.name} (${category._id})`);
    } catch (error) {
      logger.error('Error deleting category:', error);
      throw error;
    }
  }

  async archiveCategory(tenantId: string, categoryId: string, userId: string): Promise<ICategory> {
    const Category = await this.getCategoryModel(tenantId);
    const category = await Category.findById(categoryId);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const productCount = await this.getProductCount(tenantId, categoryId);
    if (productCount > 0) {
      throw new AppError(`Cannot archive category. It has ${productCount} product(s) assigned to it.`, 409);
    }

    category.isArchived = true;
    category.updatedBy = new Types.ObjectId(userId);
    await category.save();

    await this.auditService.logChange(tenantId, categoryId, userId, 'update', [
      { field: 'isArchived', oldValue: false, newValue: true }
    ]);

    logger.info(`Category archived: ${category.name} (${category._id})`);
    return category;
  }

  async unarchiveCategory(tenantId: string, categoryId: string, userId: string): Promise<ICategory> {
    const Category = await this.getCategoryModel(tenantId);
    const category = await Category.findById(categoryId);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    category.isArchived = false;
    category.updatedBy = new Types.ObjectId(userId);
    await category.save();

    await this.auditService.logChange(tenantId, categoryId, userId, 'update', [
      { field: 'isArchived', oldValue: true, newValue: false }
    ]);

    logger.info(`Category unarchived: ${category.name} (${category._id})`);
    return category;
  }

  private async getProductCount(tenantId: string, categoryId: string): Promise<number> {
    const connection = await getTenantConnection(tenantId);
    const Product = connection.model('Product');
    return await Product.countDocuments({ category: categoryId });
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
  async getCategoryStats(tenantId: string): Promise<Array<{
    id: Types.ObjectId;
    name: string;
    productCount: number;
    color?: string;
    icon?: string;
  }>> {
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

  /**
   * Get categories in tree structure
   */
   async getCategoriesTree(
     tenantId: string,
     options: {
       includeInactive?: boolean;
     } = {}
   ): Promise<ICategory[]> {
     try {
       const Category = await this.getCategoryModel(tenantId);

       const { includeInactive = false } = options;

       // Build query
       const query: Record<string, unknown> = {};
       if (!includeInactive) {
         query.isActive = true;
       }

       // Get all categories
       const categories = await Category.find(query).sort({ sortOrder: 1 });

       // Create a copy of categories array to add children
       const allCategories = JSON.parse(JSON.stringify(categories));
       const categoryMapWithChildren = new Map<string, ICategory & { children: ICategory[] }>();

       // Create map with children property
       allCategories.forEach((cat: ICategory & { children?: ICategory[] }) => {
         cat.children = [];
         categoryMapWithChildren.set(cat._id.toString(), cat);
       });

       const rootCats: (ICategory & { children: ICategory[] })[] = [];
       allCategories.forEach((cat: ICategory & { children: ICategory[]; parent?: Types.ObjectId }) => {
         if (cat.parent) {
           const parentCat = categoryMapWithChildren.get(cat.parent);
           if (parentCat) {
             parentCat.children.push(cat);
           }
         } else {
           rootCats.push(cat);
         }
       });

       return rootCats;
     } catch (error) {
       logger.error('Error getting category tree:', error);
       throw error;
     }
   }

  /**
   * Get category templates
   */
  async getTemplates(tenantId: string): Promise<Array<{
    id: string;
    name: string;
    description: string;
    categoryStructure: Array<{
      name: string;
      description: string;
      color?: string;
      icon?: string;
    }>;
  }>> {
    // For now, return some predefined templates
    // In a real implementation, these would be stored in a separate collection
    return [
      {
        id: 'template-1',
        name: 'Product Categories',
        description: 'Standard product categories for retail',
        categoryStructure: [
          { name: 'Electronics', description: 'Electronic items', color: '#3B82F6', icon: '📱' },
          { name: 'Clothing', description: 'Apparel and accessories', color: '#EF4444', icon: '👕' },
          { name: 'Home & Garden', description: 'Home improvement and gardening', color: '#10B981', icon: '🏠' },
        ]
      },
      {
        id: 'template-2',
        name: 'Service Categories',
        description: 'Service-based categories',
        categoryStructure: [
          { name: 'Consulting', description: 'Professional consulting services', color: '#8B5CF6', icon: '💼' },
          { name: 'Maintenance', description: 'Maintenance and repair services', color: '#F59E0B', icon: '🔧' },
          { name: 'Training', description: 'Educational and training services', color: '#EC489', icon: '🎓' },
        ]
      }
    ];
  }

  /**
   * Create category from template
   */
  async createFromTemplate(
    tenantId: string,
    templateId: string,
    userId: string,
    name: string,
    parentId?: string
  ): Promise<ICategory[]> {
    // Get the template
    const templates = await this.getTemplates(tenantId);
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      throw new AppError('Template not found', 404);
    }

    // Get the category model
    const Category = await this.getCategoryModel(tenantId);
    
    // Create categories based on template structure
    const createdCategories: ICategory[] = [];
    for (const catTemplate of template.categoryStructure) {
      // Check if category name already exists
      const existing = await Category.findOne({
        name: `${name} - ${catTemplate.name}`,
        isActive: true,
      });

      if (existing) {
        throw new AppError(`Category with name "${name} - ${catTemplate.name}" already exists`, 409);
      }

      const category = new Category({
        name: `${name} - ${catTemplate.name}`,
        description: catTemplate.description,
        color: catTemplate.color,
        icon: catTemplate.icon,
        parent: parentId,
        createdBy: userId,
        updatedBy: userId,
      });

      await category.save();
      createdCategories.push(category);
    }

    return createdCategories;
  }

  /**
   * Save category as template
   */
  async saveAsTemplate(
    tenantId: string,
    categoryId: string,
    templateName: string
  ): Promise<{
    id: string;
    name: string;
    description: string;
    categoryStructure: Array<{
      name: string;
      description?: string;
      color?: string;
      icon?: string;
    }>;
  }> {
    const Category = await this.getCategoryModel(tenantId);
    
    // Get the category
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // In a real implementation, we would save this to a templates collection
    // For now, we'll just return the template data
    const template = {
      id: `custom-${Date.now()}`,
      name: templateName,
      description: `Template based on "${category.name}"`,
      categoryStructure: [
        {
          name: category.name,
          description: category.description,
          color: category.color,
          icon: category.icon,
        }
      ]
    };

    return template;
  }
}

