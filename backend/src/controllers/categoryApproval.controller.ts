import { Request, Response } from 'express';
import { CategoryApprovalService } from '../services/categoryApproval.service';
import { TenantRequest } from '../types';

export class CategoryApprovalController {
  private categoryApprovalService = new CategoryApprovalService();

  /**
   * Create a new category approval request
   */
  async createApprovalRequest(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;
      const requestedBy = tenantReq.user?.id;

      if (!tenantId || !requestedBy) {
        res.status(400).json({ success: false, message: 'Tenant ID and user ID are required' });
        return;
      }

      const { categoryId, requestedChanges, approvers, approvalChain, reason } = req.body;

      if (!categoryId || !requestedChanges || !approvers || !approvalChain) {
        res.status(400).json({ 
          success: false, 
          message: 'Category ID, requested changes, approvers, and approval chain are required' 
        });
        return;
      }

      const approval = await this.categoryApprovalService.createApprovalRequest(
        tenantId,
        categoryId,
        requestedBy,
        requestedChanges,
        approvers,
        approvalChain,
        reason
      );

      res.status(201).json({
        success: true,
        data: approval,
        message: 'Category approval request created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating category approval request',
        error: (error as Error).message
      });
    }
  }

  /**
   * Get approval requests for a category
   */
  async getApprovalRequestsForCategory(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;

      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      const { categoryId } = req.params;
      const { status } = req.query;

      if (!categoryId) {
        res.status(400).json({ success: false, message: 'Category ID is required' });
        return;
      }

      const approvals = await this.categoryApprovalService.getApprovalRequestsForCategory(
        tenantId,
        categoryId,
        status as 'pending' | 'approved' | 'rejected' | 'cancelled'
      );

      res.status(200).json({
        success: true,
        data: approvals
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting approval requests for category',
        error: (error as Error).message
      });
    }
  }

  /**
   * Get approval requests for a user
   */
  async getApprovalRequestsForUser(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;
      const userId = tenantReq.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({ success: false, message: 'Tenant ID and user ID are required' });
        return;
      }

      const { type, status } = req.query;

      const approvals = await this.categoryApprovalService.getApprovalRequestsForUser(
        tenantId,
        userId,
        type as 'requested' | 'toApprove' | 'participated',
        status as 'pending' | 'approved' | 'rejected' | 'cancelled'
      );

      res.status(200).json({
        success: true,
        data: approvals
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting approval requests for user',
        error: (error as Error).message
      });
    }
  }

  /**
   * Submit an approval decision
   */
  async submitApprovalDecision(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;
      const userId = tenantReq.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({ success: false, message: 'Tenant ID and user ID are required' });
        return;
      }

      const { approvalId } = req.params;
      const { decision, reason } = req.body;

      if (!approvalId || !decision) {
        res.status(400).json({ success: false, message: 'Approval ID and decision are required' });
        return;
      }

      if (!['approve', 'reject'].includes(decision)) {
        res.status(400).json({ success: false, message: 'Decision must be either "approve" or "reject"' });
        return;
      }

      const approval = await this.categoryApprovalService.submitApprovalDecision(
        tenantId,
        approvalId,
        userId,
        decision as 'approve' | 'reject',
        reason
      );

      res.status(200).json({
        success: true,
        data: approval,
        message: `Approval decision submitted: ${decision}`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error submitting approval decision',
        error: (error as Error).message
      });
    }
  }

  /**
   * Cancel an approval request
   */
  async cancelApprovalRequest(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;
      const userId = tenantReq.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({ success: false, message: 'Tenant ID and user ID are required' });
        return;
      }

      const { approvalId } = req.params;

      if (!approvalId) {
        res.status(400).json({ success: false, message: 'Approval ID is required' });
        return;
      }

      const approval = await this.categoryApprovalService.cancelApprovalRequest(
        tenantId,
        approvalId,
        userId
      );

      res.status(200).json({
        success: true,
        data: approval,
        message: 'Approval request cancelled successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error cancelling approval request',
        error: (error as Error).message
      });
    }
  }

  /**
   * Add a comment to an approval request
   */
  async addCommentToApproval(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;
      const userId = tenantReq.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({ success: false, message: 'Tenant ID and user ID are required' });
        return;
      }

      const { approvalId } = req.params;
      const { comment } = req.body;

      if (!approvalId || !comment) {
        res.status(400).json({ success: false, message: 'Approval ID and comment are required' });
        return;
      }

      const approval = await this.categoryApprovalService.addCommentToApproval(
        tenantId,
        approvalId,
        userId,
        comment
      );

      res.status(200).json({
        success: true,
        data: approval,
        message: 'Comment added to approval request successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error adding comment to approval request',
        error: (error as Error).message
      });
    }
  }

  /**
   * Get all pending approval requests
   */
  async getPendingApprovalRequests(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;

      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      const { page, limit, sortBy, sortOrder } = req.query;

      const approvals = await this.categoryApprovalService.getPendingApprovalRequests(
        tenantId,
        {
          page: page ? parseInt(page as string, 10) : undefined,
          limit: limit ? parseInt(limit as string, 10) : undefined,
          sortBy: sortBy as string,
          sortOrder: sortOrder === 'asc' ? 'asc' : 'desc'
        }
      );

      res.status(200).json({
        success: true,
        data: approvals
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting pending approval requests',
        error: (error as Error).message
      });
    }
  }
}