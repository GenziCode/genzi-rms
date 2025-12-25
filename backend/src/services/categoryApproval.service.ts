import { getTenantConnection } from '../config/database';
import { CategoryApprovalSchema, ICategoryApproval } from '../models/categoryApproval.model';
import { ICategory } from '../models/category.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import { Types } from 'mongoose';

export class CategoryApprovalService {
  public async getCategoryApprovalModel(tenantId: string): Promise<ReturnType<typeof getTenantConnection>['model']> {
    const connection = await getTenantConnection(tenantId);
    return connection.model<ICategoryApproval>('CategoryApproval', CategoryApprovalSchema);
  }

  /**
   * Create a new category approval request
   */
  async createApprovalRequest(
    tenantId: string,
    categoryId: string,
    requestedBy: string,
    requestedChanges: Partial<ICategory>,
    approvers: string[],
    approvalChain: string[],
    reason?: string
  ): Promise<ICategoryApproval> {
    try {
      const CategoryApprovalModel = await this.getCategoryApprovalModel(tenantId);

      // Check if there's already a pending approval request for this category
      const existingRequest = await CategoryApprovalModel.findOne({
        category: categoryId,
        tenantId,
        status: 'pending'
      });

      if (existingRequest) {
        throw new AppError('There is already a pending approval request for this category', 409);
      }

      // Create the approval request
      const approvalRequest = new CategoryApprovalModel({
        tenantId,
        category: categoryId,
        requestedBy: new Types.ObjectId(requestedBy),
        requestedChanges,
        approvers: approvers.map(id => new Types.ObjectId(id)),
        approvalChain: approvalChain.map(id => new Types.ObjectId(id)),
        currentApprover: new Types.ObjectId(approvalChain[0]), // Set the first approver in the chain
        reason,
        status: 'pending'
      });

      await approvalRequest.save();

      logger.info(`Category approval request created: ${approvalRequest._id} for category ${categoryId}`);

      return approvalRequest;
    } catch (error) {
      logger.error(`Error creating category approval request: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get all approval requests for a category
   */
  async getApprovalRequestsForCategory(
    tenantId: string,
    categoryId: string,
    status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
  ): Promise<ICategoryApproval[]> {
    try {
      const CategoryApprovalModel = await this.getCategoryApprovalModel(tenantId);

      const query: Record<string, unknown> = { category: categoryId, tenantId };
      if (status) {
        query.status = status;
      }

      return await CategoryApprovalModel.find(query).populate([
        { path: 'requestedBy', select: 'firstName lastName email' },
        { path: 'approvedBy', select: 'firstName lastName email' },
        { path: 'rejectedBy', select: 'firstName lastName email' },
        { path: 'approvers', select: 'firstName lastName email' },
        { path: 'currentApprover', select: 'firstName lastName email' },
        { path: 'comments.user', select: 'firstName lastName email' }
      ]);
    } catch (error) {
      logger.error(`Error getting approval requests for category: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get approval requests for a user (either as requester or approver)
   */
  async getApprovalRequestsForUser(
    tenantId: string,
    userId: string,
    type: 'requested' | 'toApprove' | 'participated' = 'toApprove',
    status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
  ): Promise<ICategoryApproval[]> {
    try {
      const CategoryApprovalModel = await this.getCategoryApprovalModel(tenantId);

      const query: Record<string, unknown> = { tenantId };

      switch (type) {
        case 'requested':
          query.requestedBy = new Types.ObjectId(userId);
          break;
        case 'toApprove':
          query.currentApprover = new Types.ObjectId(userId);
          query.status = 'pending';
          break;
        case 'participated':
          query.$or = [
            { requestedBy: new Types.ObjectId(userId) },
            { approvers: { $in: [new Types.ObjectId(userId)] } },
            { approvedBy: new Types.ObjectId(userId) },
            { rejectedBy: new Types.ObjectId(userId) }
          ];
          break;
      }

      if (status) {
        query.status = status;
      }

      return await CategoryApprovalModel.find(query).populate([
        { path: 'category', select: 'name description' },
        { path: 'requestedBy', select: 'firstName lastName email' },
        { path: 'approvedBy', select: 'firstName lastName email' },
        { path: 'rejectedBy', select: 'firstName lastName email' },
        { path: 'approvers', select: 'firstName lastName email' },
        { path: 'currentApprover', select: 'firstName lastName email' },
        { path: 'comments.user', select: 'firstName lastName email' }
      ]);
    } catch (error) {
      logger.error(`Error getting approval requests for user: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Submit an approval decision
   */
  async submitApprovalDecision(
    tenantId: string,
    approvalId: string,
    userId: string,
    decision: 'approve' | 'reject',
    reason?: string
  ): Promise<ICategoryApproval> {
    try {
      const CategoryApprovalModel = await this.getCategoryApprovalModel(tenantId);

      // Find the approval request
      const approval = await CategoryApprovalModel.findById(approvalId);
      if (!approval) {
        throw new AppError('Approval request not found', 404);
      }

      // Check if the user is authorized to approve
      if (approval.currentApprover?.toString() !== userId) {
        throw new AppError('You are not authorized to approve this request', 403);
      }

      // Check if the approval is still pending
      if (approval.status !== 'pending') {
        throw new AppError('This approval request is no longer pending', 400);
      }

      // Process the decision
      if (decision === 'approve') {
        // Check if this is the last approver in the chain
        const userIdAsObjectId = new Types.ObjectId(userId);
        const currentIndex = approval.approvalChain.findIndex(
          approverId => approverId.toString() === userId
        );

        if (currentIndex === -1) {
          throw new AppError('You are not in the approval chain for this request', 403);
        }

        if (currentIndex === approval.approvalChain.length - 1) {
          // This is the final approval
          approval.status = 'approved';
          approval.approvedBy = userIdAsObjectId;
          approval.approvedAt = new Date();
          
          // Apply the requested changes to the category
          await this.applyChangesToCategory(
            tenantId,
            approval.category.toString(),
            approval.requestedChanges
          );
        } else {
          // Move to the next approver
          approval.currentApprover = approval.approvalChain[currentIndex + 1];
        }
      } else if (decision === 'reject') {
        // Reject the approval
        approval.status = 'rejected';
        approval.rejectedBy = new Types.ObjectId(userId);
        approval.rejectedAt = new Date();
        approval.reason = reason || approval.reason;
      }

      await approval.save();

      logger.info(`Approval decision submitted: ${decision} for approval ${approvalId} by user ${userId}`);

      return approval;
    } catch (error) {
      logger.error(`Error submitting approval decision: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Cancel an approval request
   */
  async cancelApprovalRequest(
    tenantId: string,
    approvalId: string,
    userId: string
  ): Promise<ICategoryApproval> {
    try {
      const CategoryApprovalModel = await this.getCategoryApprovalModel(tenantId);

      const approval = await CategoryApprovalModel.findById(approvalId);
      if (!approval) {
        throw new AppError('Approval request not found', 404);
      }

      // Only the person who requested the approval can cancel it
      if (approval.requestedBy.toString() !== userId) {
        throw new AppError('You are not authorized to cancel this approval request', 403);
      }

      // Can only cancel if it's still pending
      if (approval.status !== 'pending') {
        throw new AppError('Cannot cancel an approval request that is not pending', 400);
      }

      approval.status = 'cancelled';
      await approval.save();

      logger.info(`Approval request cancelled: ${approvalId} by user ${userId}`);

      return approval;
    } catch (error) {
      logger.error(`Error cancelling approval request: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Add a comment to an approval request
   */
  async addCommentToApproval(
    tenantId: string,
    approvalId: string,
    userId: string,
    comment: string
  ): Promise<ICategoryApproval> {
    try {
      const CategoryApprovalModel = await this.getCategoryApprovalModel(tenantId);

      const approval = await CategoryApprovalModel.findById(approvalId);
      if (!approval) {
        throw new AppError('Approval request not found', 404);
      }

      // Check if user is involved in the approval process
      const isInvolved =
        approval.requestedBy.toString() === userId ||
        approval.approvers.some(a => a.toString() === userId) ||
        approval.currentApprover?.toString() === userId;

      if (!isInvolved) {
        throw new AppError('You are not authorized to comment on this approval request', 403);
      }

      approval.comments.push({
        user: new Types.ObjectId(userId),
        comment,
        createdAt: new Date()
      });

      await approval.save();

      logger.info(`Comment added to approval: ${approvalId} by user ${userId}`);

      return approval;
    } catch (error) {
      logger.error(`Error adding comment to approval: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get all pending approval requests
   */
  async getPendingApprovalRequests(
    tenantId: string,
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    approvals: ICategoryApproval[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const CategoryApprovalModel = await this.getCategoryApprovalModel(tenantId);

      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;

      const query = { tenantId, status: 'pending' };

      // Count total
      const total = await CategoryApprovalModel.countDocuments(query);

      // Get approvals with pagination
      const approvals = await CategoryApprovalModel.find(query)
        .populate([
          { path: 'category', select: 'name description' },
          { path: 'requestedBy', select: 'firstName lastName email' },
          { path: 'currentApprover', select: 'firstName lastName email' },
          { path: 'comments.user', select: 'firstName lastName email' }
        ])
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      return {
        approvals,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error(`Error getting pending approval requests: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Apply approved changes to the category
   */
  private async applyChangesToCategory(
    tenantId: string,
    categoryId: string,
    changes: Partial<ICategory>
  ): Promise<void> {
    try {
      const connection = await getTenantConnection(tenantId);
      const { CategorySchema } = await import('../models/category.model');
      const Category = connection.model<ICategory>('Category', CategorySchema);

      // Only update fields that are in the requestedChanges
      const updateData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(changes)) {
        if (value !== undefined) {
          updateData[key] = value;
        }
      }

      await Category.findByIdAndUpdate(categoryId, updateData);
      
      logger.info(`Changes applied to category: ${categoryId}`);
    } catch (error) {
      logger.error(`Error applying changes to category: ${(error as Error).message}`);
      throw error;
    }
  }
}
