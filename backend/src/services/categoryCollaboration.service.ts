import { getTenantConnection } from '../config/database';
import { CategoryCollaborationSchema, ICategoryCollaboration } from '../models/categoryCollaboration.model';
import { ICategory } from '../models/category.model';
import { IUser } from '../models/user.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export class CategoryCollaborationService {
  public async getCategoryCollaborationModel(tenantId: string): Promise<any> {
    const connection = await getTenantConnection(tenantId);
    return connection.model<ICategoryCollaboration>('CategoryCollaboration', CategoryCollaborationSchema);
  }

  /**
   * Invite a user to collaborate on a category
   */
  async inviteUser(
    tenantId: string,
    categoryId: string,
    invitedUserId: string,
    inviterUserId: string,
    role: 'viewer' | 'editor' | 'admin',
    permissions: string[] = []
  ): Promise<ICategoryCollaboration> {
    const CategoryCollaboration = await this.getCategoryCollaborationModel(tenantId);
    const { Category } = await this.getModels(tenantId);

    // Verify that the category exists and belongs to the tenant
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Check if user is already collaborating on this category
    const existingCollaboration = await CategoryCollaboration.findOne({
      categoryId,
      userId: invitedUserId,
      tenantId,
    });

    if (existingCollaboration) {
      // If user is already collaborating, update their role/permissions
      existingCollaboration.role = role;
      existingCollaboration.permissions = permissions;
      existingCollaboration.invitedBy = inviterUserId;
      existingCollaboration.invitedAt = new Date();
      existingCollaboration.isActive = false; // Reset to inactive until user accepts again
      return await existingCollaboration.save();
    }

    // Create new collaboration invitation
    const collaboration = new CategoryCollaboration({
      tenantId,
      categoryId,
      userId: invitedUserId,
      role,
      permissions,
      invitedBy: inviterUserId,
      invitedAt: new Date(),
      isActive: false,
    });

    await collaboration.save();

    logger.info(`User ${inviterUserId} invited ${invitedUserId} to collaborate on category ${categoryId}`);

    return collaboration;
  }

  /**
   * Accept a collaboration invitation
   */
  async acceptInvitation(
    tenantId: string,
    userId: string,
    collaborationId: string
  ): Promise<ICategoryCollaboration> {
    const CategoryCollaboration = await this.getCategoryCollaborationModel(tenantId);

    const collaboration = await CategoryCollaboration.findOne({
      _id: collaborationId,
      userId,
      tenantId,
    });

    if (!collaboration) {
      throw new AppError('Collaboration invitation not found', 404);
    }

    if (collaboration.isActive) {
      throw new AppError('Collaboration invitation already accepted', 400);
    }

    collaboration.isActive = true;
    collaboration.acceptedAt = new Date();
    await collaboration.save();

    logger.info(`User ${userId} accepted collaboration invitation for category ${collaboration.categoryId}`);

    return collaboration;
  }

  /**
   * Reject a collaboration invitation
   */
  async rejectInvitation(
    tenantId: string,
    userId: string,
    collaborationId: string
  ): Promise<void> {
    const CategoryCollaboration = await this.getCategoryCollaborationModel(tenantId);

    const collaboration = await CategoryCollaboration.findOne({
      _id: collaborationId,
      userId,
      tenantId,
    });

    if (!collaboration) {
      throw new AppError('Collaboration invitation not found', 404);
    }

    await CategoryCollaboration.deleteOne({ _id: collaborationId });

    logger.info(`User ${userId} rejected collaboration invitation for category ${collaboration.categoryId}`);
  }

  /**
   * Remove a collaborator from a category
   */
  async removeCollaborator(
    tenantId: string,
    categoryId: string,
    userId: string,
    removerUserId: string
  ): Promise<void> {
    const CategoryCollaboration = await this.getCategoryCollaborationModel(tenantId);

    const collaboration = await CategoryCollaboration.findOne({
      categoryId,
      userId,
      tenantId,
    });

    if (!collaboration) {
      throw new AppError('Collaboration not found', 404);
    }

    await CategoryCollaboration.deleteOne({ _id: collaboration._id });

    logger.info(`User ${removerUserId} removed ${userId} as collaborator from category ${categoryId}`);
  }

  /**
   * Update collaborator permissions
   */
  async updateCollaboratorPermissions(
    tenantId: string,
    categoryId: string,
    userId: string,
    role: 'viewer' | 'editor' | 'admin',
    permissions: string[],
    updaterUserId: string
  ): Promise<ICategoryCollaboration> {
    const CategoryCollaboration = await this.getCategoryCollaborationModel(tenantId);

    const collaboration = await CategoryCollaboration.findOne({
      categoryId,
      userId,
      tenantId,
    });

    if (!collaboration) {
      throw new AppError('Collaboration not found', 404);
    }

    collaboration.role = role;
    collaboration.permissions = permissions;
    await collaboration.save();

    logger.info(`User ${updaterUserId} updated permissions for ${userId} on category ${categoryId}`);

    return collaboration;
  }

  /**
   * Get collaborators for a category
   */
  async getCategoryCollaborators(
    tenantId: string,
    categoryId: string,
    includeInactive: boolean = false
  ): Promise<(ICategoryCollaboration & { user: Partial<IUser> })[]> {
    const CategoryCollaboration = await this.getCategoryCollaborationModel(tenantId);
    const { User } = await this.getModels(tenantId);

    const query: any = { categoryId, tenantId };
    if (!includeInactive) {
      query.isActive = true;
    }

    const collaborations = await CategoryCollaboration.find(query).sort({ createdAt: -1 });

    // Get user details for each collaborator
    const collaboratorIds = collaborations.map(c => c.userId);
    const users = await User.find({ _id: { $in: collaboratorIds } }).select('email firstName lastName role').lean();

    // Map user details to collaborations
    const result: any[] = [];
    for (const collab of collaborations) {
      const user = users.find(u => u._id.toString() === collab.userId);
      result.push({
        ...collab.toObject(),
        user: user || null
      });
    }
    return result;
  }

 /**
   * Get categories a user collaborates on
   */
  async getUserCollaboratedCategories(
    tenantId: string,
    userId: string
  ): Promise<(ICategoryCollaboration & { category: Partial<ICategory> })[]> {
    const CategoryCollaboration = await this.getCategoryCollaborationModel(tenantId);
    const { Category } = await this.getModels(tenantId);

    const collaborations = await CategoryCollaboration.find({
      userId,
      tenantId,
      isActive: true,
    });

    // Get category details for each collaboration
    const categoryIds = collaborations.map(c => c.categoryId);
    const categories = await Category.find({ _id: { $in: categoryIds } }).select('name description color icon').lean();

    // Map category details to collaborations
    const result: any[] = [];
    for (const collab of collaborations) {
      const category = categories.find(c => c._id.toString() === collab.categoryId);
      result.push({
        ...collab.toObject(),
        category: category || null
      });
    }
    return result;
  }

  /**
   * Get pending invitations for a user
   */
  async getUserPendingInvitations(
    tenantId: string,
    userId: string
  ): Promise<ICategoryCollaboration[]> {
    const CategoryCollaboration = await this.getCategoryCollaborationModel(tenantId);
    const { Category } = await this.getModels(tenantId);

    const collaborations = await CategoryCollaboration.find({
      userId,
      tenantId,
      isActive: false,
    });

    return collaborations;
  }

  /**
   * Check if a user has permission to collaborate on a category
   */
  async hasCollaborationPermission(
    tenantId: string,
    userId: string,
    categoryId: string,
    requiredPermission?: string
  ): Promise<boolean> {
    const CategoryCollaboration = await this.getCategoryCollaborationModel(tenantId);

    const collaboration = await CategoryCollaboration.findOne({
      userId,
      categoryId,
      tenantId,
      isActive: true,
    });

    if (!collaboration) {
      return false;
    }

    // If no specific permission is required, just check if user is a collaborator
    if (!requiredPermission) {
      return true;
    }

    // Check if user has the required permission or role-based permissions
    const hasPermission = collaboration.permissions.includes(requiredPermission);
    const hasRolePermission = this.checkRolePermission(collaboration.role, requiredPermission);

    return hasPermission || hasRolePermission;
  }

  /**
   * Toggle notifications for a collaboration
   */
  async toggleNotifications(
    tenantId: string,
    userId: string,
    categoryId: string,
    enabled: boolean
  ): Promise<ICategoryCollaboration> {
    const CategoryCollaboration = await this.getCategoryCollaborationModel(tenantId);

    const collaboration = await CategoryCollaboration.findOne({
      userId,
      categoryId,
      tenantId,
      isActive: true,
    });

    if (!collaboration) {
      throw new AppError('Active collaboration not found', 404);
    }

    collaboration.notificationsEnabled = enabled;
    await collaboration.save();

    return collaboration;
  }

  /**
   * Update last accessed time for a collaboration
   */
  async updateLastAccessed(
    tenantId: string,
    userId: string,
    categoryId: string
  ): Promise<void> {
    const CategoryCollaboration = await this.getCategoryCollaborationModel(tenantId);

    await CategoryCollaboration.updateOne(
      { userId, categoryId, tenantId, isActive: true },
      { lastAccessedAt: new Date() }
    );
  }

 /**
   * Helper method to check role-based permissions
   */
  private checkRolePermission(role: string, permission: string): boolean {
    switch (role) {
      case 'admin':
        // Admins have all permissions
        return true;
      case 'editor':
        // Editors can view, edit, but not delete or manage collaborators
        return !['delete', 'manage_collaborators', 'admin'].includes(permission);
      case 'viewer':
        // Viewers can only view
        return permission === 'view';
      default:
        return false;
    }
  }

  /**
   * Helper method to get models
   */
  private async getModels(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    const { CategorySchema } = await import('../models/category.model');
    const { UserSchema } = await import('../models/user.model');

    return {
      Category: connection.model<ICategory>('Category', CategorySchema),
      User: connection.model<IUser>('User', UserSchema),
    };
  }
}
