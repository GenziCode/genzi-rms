import { getTenantConnection } from '../config/database';
import { CategorySchema, ICategory } from '../models/category.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export interface CategoryReport {
  totalCategories: number;
  activeCategories: number;
  inactiveCategories: number;
  categoriesByStatus: {
    active: number;
    inactive: number;
  };
  categoriesByColor: Array<{
    color: string;
    count: number;
  }>;
  categoriesByParent: Array<{
    parentName: string;
    parentId: string;
    childCount: number;
  }>;
  categoryGrowth: Array<{
    month: string;
    year: number;
    newCategories: number;
  }>;
  topLevelCategories: number;
  categoriesWithProducts: number;
  categoriesWithoutProducts: number;
}

export interface CategoryUsageReport {
  categoryId: string;
  categoryName: string;
  productCount: number;
  totalSales: number;
  totalQuantitySold: number;
  averageOrderValue: number;
  lastUsed: Date;
}

export interface CategoryPerformanceReport {
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  productCount: number;
  revenue: number;
  revenuePercentage: number;
  quantitySold: number;
  profit: number;
  profitMargin: number;
  growthRate: number;
}

export class CategoryReportsService {
  private async getCategoryModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<ICategory>('Category', CategorySchema);
  }

  /**
   * Generate comprehensive category report
   */
  async generateCategoryReport(tenantId: string): Promise<CategoryReport> {
    try {
      const Category = await this.getCategoryModel(tenantId);
      const connection = await getTenantConnection(tenantId);
      const Product = connection.model('Product');
      
      // Get all categories
      const categories = await Category.find({}).lean();
      
      // Calculate basic counts
      const totalCategories = categories.length;
      const activeCategories = categories.filter(cat => cat.isActive).length;
      const inactiveCategories = totalCategories - activeCategories;
      
      // Count by status
      const categoriesByStatus = {
        active: activeCategories,
        inactive: inactiveCategories,
      };
      
      // Count by color
      const colorCountMap = new Map<string, number>();
      categories.forEach(cat => {
        if (cat.color) {
          const count = colorCountMap.get(cat.color) || 0;
          colorCountMap.set(cat.color, count + 1);
        }
      });
      
      const categoriesByColor = Array.from(colorCountMap, ([color, count]) => ({
        color,
        count
      }));
      
      // Count children by parent
      const parentCountMap = new Map<string, { name: string; count: number }>();
      categories.forEach(cat => {
        if (cat.parent) {
          const parentId = cat.parent.toString();
          const existing = parentCountMap.get(parentId);
          if (existing) {
            parentCountMap.set(parentId, { 
              name: existing.name, 
              count: existing.count + 1 
            });
          } else {
            // Find parent category to get its name
            const parentCat = categories.find(c => c._id.toString() === parentId);
            parentCountMap.set(parentId, { 
              name: parentCat?.name || 'Unknown Parent', 
              count: 1 
            });
          }
        }
      });
      
      const categoriesByParent = Array.from(parentCountMap, ([id, data]) => ({
        parentId: id,
        parentName: data.name,
        childCount: data.count
      }));
      
      // Calculate growth by month
      const monthlyGrowth = new Map<string, number>();
      categories.forEach(cat => {
        const date = new Date(cat.createdAt);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const count = monthlyGrowth.get(monthYear) || 0;
        monthlyGrowth.set(monthYear, count + 1);
      });
      
      const categoryGrowth = Array.from(monthlyGrowth, ([monthYear, count]) => {
        const [year, month] = monthYear.split('-').map(Number);
        return {
          month: new Date(year, month - 1).toLocaleString('default', { month: 'short' }),
          year,
          newCategories: count
        };
      });
      
      // Count top level categories (no parent)
      const topLevelCategories = categories.filter(cat => !cat.parent).length;
      
      // Count categories with products vs without
      const categoriesWithProducts = await Category.aggregate([
        {
          $lookup: {
            from: 'products', // assuming the products collection name
            localField: '_id',
            foreignField: 'category',
            as: 'products'
          }
        },
        {
          $addFields: {
            productCount: { $size: '$products' }
          }
        },
        {
          $match: {
            productCount: { $gt: 0 }
          }
        }
      ]);
      
      const categoriesWithoutProducts = totalCategories - categoriesWithProducts.length;
      
      return {
        totalCategories,
        activeCategories,
        inactiveCategories,
        categoriesByStatus,
        categoriesByColor,
        categoriesByParent,
        categoryGrowth,
        topLevelCategories,
        categoriesWithProducts: categoriesWithProducts.length,
        categoriesWithoutProducts
      };
    } catch (error) {
      logger.error('Error generating category report:', error);
      throw error;
    }
  }

  /**
   * Generate category usage report
   */
  async generateCategoryUsageReport(tenantId: string): Promise<CategoryUsageReport[]> {
    try {
      const Category = await this.getCategoryModel(tenantId);
      const connection = await getTenantConnection(tenantId);
      const Product = connection.model('Product');
      const Sale = connection.model('Sale');
      
      // Get all categories
      const categories = await Category.find({ isActive: true }).lean();
      
      // Get all products with their categories
      const products = await Product.find({}).populate('category');
      
      // Group products by category
      const productsByCategory = new Map<string, any[]>();
      products.forEach(product => {
        const categoryId = (product.category as any)?._id?.toString();
        if (categoryId) {
          if (!productsByCategory.has(categoryId)) {
            productsByCategory.set(categoryId, []);
          }
          productsByCategory.get(categoryId)?.push(product);
        }
      });
      
      // Calculate usage metrics for each category
      const reports: CategoryUsageReport[] = [];
      
      for (const category of categories) {
        const categoryProducts = productsByCategory.get(category._id.toString()) || [];
        const productIds = categoryProducts.map(p => p._id);
        
        // Get sales related to products in this category
        let totalSales = 0;
        let totalQuantitySold = 0;
        let saleCount = 0;
        let lastUsed: Date | null = null;
        
        if (productIds.length > 0) {
          const sales = await Sale.find({
            'items.productId': { $in: productIds }
          }).populate('items.productId');
          
          saleCount = sales.length;
          
          for (const sale of sales) {
            for (const item of sale.items) {
              if (productIds.includes(item.productId._id)) {
                totalSales += item.price * item.quantity;
                totalQuantitySold += item.quantity;
                
                // Update last used if this sale is more recent
                if (!lastUsed || sale.createdAt > lastUsed) {
                  lastUsed = sale.createdAt;
                }
              }
            }
          }
        }
        
        reports.push({
          categoryId: category._id.toString(),
          categoryName: category.name,
          productCount: categoryProducts.length,
          totalSales,
          totalQuantitySold,
          averageOrderValue: totalSales > 0 && saleCount > 0 ? totalSales / saleCount : 0,
          lastUsed: lastUsed || category.updatedAt
        });
      }
      
      return reports;
    } catch (error) {
      logger.error('Error generating category usage report:', error);
      throw error;
    }
  }

  /**
   * Generate category performance report
   */
  async generateCategoryPerformanceReport(tenantId: string): Promise<CategoryPerformanceReport[]> {
    try {
      const Category = await this.getCategoryModel(tenantId);
      const connection = await getTenantConnection(tenantId);
      const Product = connection.model('Product');
      const Sale = connection.model('Sale');
      
      // Get all active categories
      const categories = await Category.find({ isActive: true }).lean();
      
      // Get all products with their categories
      const products = await Product.find({}).populate('category');
      
      // Group products by category
      const productsByCategory = new Map<string, any[]>();
      products.forEach(product => {
        const categoryId = (product.category as any)?._id?.toString();
        if (categoryId) {
          if (!productsByCategory.has(categoryId)) {
            productsByCategory.set(categoryId, []);
          }
          productsByCategory.get(categoryId)?.push(product);
        }
      });
      
      // Calculate performance metrics for each category
      const reports: CategoryPerformanceReport[] = [];
      let totalRevenue = 0;
      
      // First pass: calculate total revenue across all categories
      for (const category of categories) {
        const categoryProducts = productsByCategory.get(category._id.toString()) || [];
        const productIds = categoryProducts.map(p => p._id);
        
        if (productIds.length > 0) {
          const sales = await Sale.find({
            'items.productId': { $in: productIds }
          }).populate('items.productId');
          
          let categoryRevenue = 0;
          let categoryQuantitySold = 0;
          
          for (const sale of sales) {
            for (const item of sale.items) {
              if (productIds.includes(item.productId._id)) {
                categoryRevenue += item.price * item.quantity;
                categoryQuantitySold += item.quantity;
              }
            }
          }
          
          totalRevenue += categoryRevenue;
        }
      }
      
      // Second pass: calculate metrics with percentage values
      for (const category of categories) {
        const categoryProducts = productsByCategory.get(category._id.toString()) || [];
        const productIds = categoryProducts.map(p => p._id);
        
        let revenue = 0;
        let quantitySold = 0;
        let profit = 0;
        
        if (productIds.length > 0) {
          const sales = await Sale.find({
            'items.productId': { $in: productIds }
          }).populate('items.productId');
          
          for (const sale of sales) {
            for (const item of sale.items) {
              if (productIds.includes(item.productId._id)) {
                const itemRevenue = item.price * item.quantity;
                revenue += itemRevenue;
                quantitySold += item.quantity;
                
                // Calculate profit (simplified - in real app, would need cost data)
                const cost = (item.productId as any).cost || 0;
                const itemProfit = (item.price - cost) * item.quantity;
                profit += itemProfit;
              }
            }
          }
        }
        
        const revenuePercentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
        const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
        
        // Calculate growth rate (simplified - would need more complex calculation in real app)
        const growthRate = 0; // Placeholder - would require historical data
        
        reports.push({
          categoryId: category._id.toString(),
          categoryName: category.name,
          color: category.color || '#3B82F6',
          icon: category.icon || '📁',
          productCount: categoryProducts.length,
          revenue,
          revenuePercentage,
          quantitySold,
          profit,
          profitMargin,
          growthRate
        });
      }
      
      return reports;
    } catch (error) {
      logger.error('Error generating category performance report:', error);
      throw error;
    }
  }

  /**
   * Get category hierarchy report
   */
  async generateCategoryHierarchyReport(tenantId: string): Promise<any[]> {
    try {
      const Category = await this.getCategoryModel(tenantId);
      
      // Get all categories
      const categories = await Category.find({}).sort({ sortOrder: 1 }).lean();
      
      // Build a map for quick lookup
      const categoryMap = new Map<string, any>();
      categories.forEach(cat => {
        categoryMap.set(cat._id.toString(), { ...cat, children: [] });
      });
      
      // Build the hierarchy
      const rootCategories: any[] = [];
      
      categories.forEach(cat => {
        const category = categoryMap.get(cat._id.toString());
        if (cat.parent) {
          const parent = categoryMap.get(cat.parent.toString());
          if (parent) {
            parent.children.push(category);
          } else {
            // If parent doesn't exist, add to root
            rootCategories.push(category);
          }
        } else {
          rootCategories.push(category);
        }
      });
      
      return rootCategories;
    } catch (error) {
      logger.error('Error generating category hierarchy report:', error);
      throw error;
    }
 }
}