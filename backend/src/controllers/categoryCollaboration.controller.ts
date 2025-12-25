import { Request, Response } from 'express';
import { CategoryCollaborationService } from '../services/categoryCollaboration.service';
import { TenantRequest } from '../types';

export class CategoryCollaborationController {
  private categoryCollaborationService = new CategoryCollaborationService();

  /**
   * Invite a user to collaborate on a category
   */
  async inviteUser(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;
      const inviterUserId = tenantReq.user?.id;

      if (!tenantId || !inviterUserId) {
        res.status(400).json({ success: false, message: 'Tenant ID and user ID are required' });
        return;
      }

      const { categoryId, invitedUserId, role, permissions } = req.body;

      if (!categoryId || !invitedUserId || !role) {
        res.status(400).json({ success: false, message: 'Category ID, invited user ID, and role are required' });
        return;
      }

      const collaboration = await this.categoryCollaborationService.inviteUser(
        tenantId,
        categoryId,
        invitedUserId,
        inviterUserId,
        role,
        permissions || []
      );

      res.status(201).json({
        success: true,
        data: collaboration,
        message: 'User invited to collaborate successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error inviting user to collaborate',
        error: (error as Error).message
      });
    }
  }

  /**
   * Accept a collaboration invitation
   */
  async acceptInvitation(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;
      const userId = tenantReq.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({ success: false, message: 'Tenant ID and user ID are required' });
        return;
      }

      const { collaborationId } = req.params;

      if (!collaborationId) {
        res.status(400).json({ success: false, message: 'Collaboration ID is required' });
        return;
      }

      const collaboration = await this.categoryCollaborationService.acceptInvitation(
        tenantId,
        userId,
        collaborationId
      );

      res.status(200).json({
        success: true,
        data: collaboration,
        message: 'Collaboration invitation accepted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error accepting collaboration invitation',
        error: (error as Error).message
      });
    }
  }

  /**
   * Reject a collaboration invitation
   */
  async rejectInvitation(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;
      const userId = tenantReq.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({ success: false, message: 'Tenant ID and user ID are required' });
        return;
      }

      const { collaborationId } = req.params;

      if (!collaborationId) {
        res.status(400).json({ success: false, message: 'Collaboration ID is required' });
        return;
      }

      await this.categoryCollaborationService.rejectInvitation(
        tenantId,
        userId,
        collaborationId
      );

      res.status(200).json({
        success: true,
        message: 'Collaboration invitation rejected successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error rejecting collaboration invitation',
        error: (error as Error).message
      });
    }
  }

  /**
   * Remove a collaborator from a category
   */
  async removeCollaborator(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;
      const removerUserId = tenantReq.user?.id;

      if (!tenantId || !removerUserId) {
        res.status(400).json({ success: false, message: 'Tenant ID and user ID are required' });
        return;
      }

      const { categoryId, userId } = req.params;

      if (!categoryId || !userId) {
        res.status(400).json({ success: false, message: 'Category ID and user ID are required' });
        return;
      }

      await this.categoryCollaborationService.removeCollaborator(
        tenantId,
        categoryId,
        userId,
        removerUserId
      );

      res.status(200).json({
        success: true,
        message: 'Collaborator removed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error removing collaborator',
        error: (error as Error).message
      });
    }
  }

  /**
   * Update collaborator permissions
   */
  async updateCollaboratorPermissions(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;
      const updaterUserId = tenantReq.user?.id;

      if (!tenantId || !updaterUserId) {
        res.status(400).json({ success: false, message: 'Tenant ID and user ID are required' });
        return;
      }

      const { categoryId, userId } = req.params;
      const { role, permissions } = req.body;

      if (!categoryId || !userId || !role) {
        res.status(400).json({ success: false, message: 'Category ID, user ID, and role are required' });
        return;
      }

      const collaboration = await this.categoryCollaborationService.updateCollaboratorPermissions(
        tenantId,
        categoryId,
        userId,
        role,
        permissions || [],
        updaterUserId
      );

      res.status(200).json({
        success: true,
        data: collaboration,
        message: 'Collaborator permissions updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating collaborator permissions',
        error: (error as Error).message
      });
    }
  }

  /**
   * Get collaborators for a category
   */
  async getCategoryCollaborators(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;

      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant ID is required' });
        return;
      }

      const { categoryId } = req.params;
      const { includeInactive } = req.query;

      if (!categoryId) {
        res.status(400).json({ success: false, message: 'Category ID is required' });
        return;
      }

      const collaborators = await this.categoryCollaborationService.getCategoryCollaborators(
        tenantId,
        categoryId,
        includeInactive === 'true'
      );

      res.status(200).json({
        success: true,
        data: collaborators
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting category collaborators',
        error: (error as Error).message
      });
    }
  }

  /**
   * Get categories a user collaborates on
   */
  async getUserCollaboratedCategories(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;
      const userId = tenantReq.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({ success: false, message: 'Tenant ID and user ID are required' });
        return;
      }

      const categories = await this.categoryCollaborationService.getUserCollaboratedCategories(
        tenantId,
        userId
      );

      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting user collaborated categories',
        error: (error as Error).message
      });
    }
  }

  /**
   * Get pending invitations for a user
   */
  async getUserPendingInvitations(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;
      const userId = tenantReq.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({ success: false, message: 'Tenant ID and user ID are required' });
        return;
      }

      const invitations = await this.categoryCollaborationService.getUserPendingInvitations(
        tenantId,
        userId
      );

      res.status(200).json({
        success: true,
        data: invitations
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting user pending invitations',
        error: (error as Error).message
      });
    }
  }

  /**
   * Check if a user has permission to collaborate on a category
   */
  async checkCollaborationPermission(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;
      const userId = tenantReq.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({ success: false, message: 'Tenant ID and user ID are required' });
        return;
      }

      const { categoryId } = req.params;
      const { requiredPermission } = req.query;

      if (!categoryId) {
        res.status(400).json({ success: false, message: 'Category ID is required' });
        return;
      }

      const hasPermission = await this.categoryCollaborationService.hasCollaborationPermission(
        tenantId,
        userId,
        categoryId,
        typeof requiredPermission === 'string' ? requiredPermission : undefined
      );

      res.status(200).json({
        success: true,
        data: { hasPermission }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error checking collaboration permission',
        error: (error as Error).message
      });
    }
  }

  /**
   * Toggle notifications for a collaboration
   */
  async toggleNotifications(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;
      const userId = tenantReq.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({ success: false, message: 'Tenant ID and user ID are required' });
        return;
      }

      const { categoryId } = req.params;
      const { enabled } = req.body;

      if (!categoryId) {
        res.status(400).json({ success: false, message: 'Category ID is required' });
        return;
      }

      if (enabled === undefined) {
        res.status(400).json({ success: false, message: 'Enabled flag is required' });
        return;
      }

      const collaboration = await this.categoryCollaborationService.toggleNotifications(
        tenantId,
        userId,
        categoryId,
        enabled
      );

      res.status(200).json({
        success: true,
        data: collaboration,
        message: 'Notifications setting updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error toggling notifications',
        error: (error as Error).message
      });
    }
  }

  /**
   * Update last accessed time for a collaboration
   */
  async updateLastAccessed(req: Request, res: Response): Promise<void> {
    try {
      const tenantReq = req as TenantRequest;
      const tenantId = tenantReq.tenant?.id;
      const userId = tenantReq.user?.id;

      if (!tenantId || !userId) {
        res.status(400).json({ success: false, message: 'Tenant ID and user ID are required' });
        return;
      }

      const { categoryId } = req.params;

      if (!categoryId) {
        res.status(400).json({ success: false, message: 'Category ID is required' });
        return;
      }

      await this.categoryCollaborationService.updateLastAccessed(
        tenantId,
        userId,
        categoryId
      );

      res.status(200).json({
        success: true,
        message: 'Last accessed time updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating last accessed time',
        error: (error as Error).message
      });
    }
  }
}