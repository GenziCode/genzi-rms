import { getTenantConnection } from '../config/database';
import { CategorySchema, ICategory } from '../models/category.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import { TenantSchema } from '../models/tenant.model';
import { getMasterConnection } from '../config/database';
import { Types } from 'mongoose';

export class CategorySharingService {
  private async getModels(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    const masterConnection = await getMasterConnection();
    return {
      Category: connection.model<ICategory>('Category', CategorySchema),
      Tenant: masterConnection.model('Tenant', TenantSchema),
    };
  }

  async shareCategoryWithTenants(tenantId: string, categoryId: string, targetTenantIds: string[]): Promise<ICategory> {
    const { Category, Tenant } = await this.getModels(tenantId);

    const category = await Category.findById(categoryId);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const tenants = await Tenant.find({ _id: { $in: targetTenantIds } });
    if (tenants.length !== targetTenantIds.length) {
      throw new AppError('One or more target tenants not found', 404);
    }

    const newSharedWith = [...new Set([...category.sharedWith.map(id => id.toString()), ...targetTenantIds])];
    category.sharedWith = newSharedWith as any;
    await category.save();

    logger.info(`Category ${categoryId} shared with tenants: ${targetTenantIds.join(', ')}`);

    return category;
  }

  async makeCategoryPublic(tenantId: string, categoryId: string): Promise<ICategory> {
    const { Category } = await this.getModels(tenantId);

    const category = await Category.findById(categoryId);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    category.isPublic = true;
    await category.save();

    logger.info(`Category ${categoryId} made public`);

    return category;
  }

  async revokeSharing(tenantId: string, categoryId: string, targetTenantIds: string[]): Promise<ICategory> {
    const { Category } = await this.getModels(tenantId);

    const category = await Category.findById(categoryId);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    category.sharedWith = category.sharedWith.filter(id => !targetTenantIds.includes(id.toString()));
    await category.save();

    logger.info(`Sharing revoked for category ${categoryId} from tenants: ${targetTenantIds.join(', ')}`);

    return category;
  }
  
  async getSharedCategories(tenantId: string): Promise<ICategory[]> {
    const { Category } = await this.getModels(tenantId);
    
    // This is a simplified example. In a real application, you would need to query 
    // the categories from the master database or the tenants' databases where they are shared.
    // This would likely involve a more complex data architecture.
    const publicCategories = await Category.find({ isPublic: true });
    
    return publicCategories;
  }
}