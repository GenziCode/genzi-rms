import { Response, NextFunction } from 'express';
import { TenantRequest } from '../types';
import { CategoryNotificationService } from '../services/categoryNotification.service';
import { successResponse } from '../utils/response';

export class CategoryNotificationController {
  private categoryNotificationService: CategoryNotificationService;

  constructor() {
    this.categoryNotificationService = new CategoryNotificationService();
  }

  /**
   * Create a new category notification
   * POST /api/notifications/categories
   */
  createNotification = async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const {
        categoryId,
        title,
        message,
        type,
        priority,
        recipientIds,
        scheduledAt,
        expiresAt,
        metadata
      } = req.body;

      const notification = await this.categoryNotificationService.createNotification(
        tenantId,
        userId,
        categoryId,
        title,
        message,
        type,
        priority,
        recipientIds,
        scheduledAt ? new Date(scheduledAt) : undefined,
        expiresAt ? new Date(expiresAt) : undefined,
        metadata
      );

      res.status(201).json(
        successResponse(notification, 'Category notification created successfully', 201)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get notifications for a specific category
   * GET /api/notifications/categories/:categoryId
   */
  getCategoryNotifications = async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const { categoryId } = req.params;
      const {
        type,
        priority,
        limit,
        page,
        sortBy,
        sortOrder
      } = req.query;

      const result = await this.categoryNotificationService.getCategoryNotifications(
        tenantId,
        categoryId,
        {
          type: type as 'info' | 'warning' | 'error' | 'success',
          priority: priority as 'low' | 'medium' | 'high' | 'critical',
          limit: limit ? parseInt(limit as string) : undefined,
          page: page ? parseInt(page as string) : undefined,
          sortBy: sortBy as 'createdAt' | 'sentAt' | 'priority',
          sortOrder: sortOrder as 'asc' | 'desc',
        }
      );

      res.json(
        successResponse(result.notifications, 'Category notifications retrieved successfully', 200, {
          pagination: {
            page: result.page,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
            total: result.total,
            totalPages: result.totalPages,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get notifications for the current user
   * GET /api/notifications/my-notifications
   */
  getUserNotifications = async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const {
        type,
        priority,
        isRead,
        isAcknowledged,
        limit,
        page,
        sortBy,
        sortOrder
      } = req.query;

      const result = await this.categoryNotificationService.getUserNotifications(
        tenantId,
        userId,
        {
          type: type as 'info' | 'warning' | 'error' | 'success',
          priority: priority as 'low' | 'medium' | 'high' | 'critical',
          isRead: isRead === 'true',
          isAcknowledged: isAcknowledged === 'true',
          limit: limit ? parseInt(limit as string) : undefined,
          page: page ? parseInt(page as string) : undefined,
          sortBy: sortBy as 'createdAt' | 'sentAt' | 'priority',
          sortOrder: sortOrder as 'asc' | 'desc',
        }
      );

      res.json(
        successResponse(result.notifications, 'User notifications retrieved successfully', 200, {
          pagination: {
            page: result.page,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
            total: result.total,
            totalPages: result.totalPages,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark a notification as read
   * PUT /api/notifications/:id/read
   */
  markAsRead = async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { id } = req.params;

      const notification = await this.categoryNotificationService.markAsRead(
        tenantId,
        id,
        userId
      );

      res.json(
        successResponse(notification, 'Notification marked as read successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Acknowledge a notification
   * PUT /api/notifications/:id/acknowledge
   */
  acknowledge = async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { id } = req.params;

      const notification = await this.categoryNotificationService.acknowledge(
        tenantId,
        id,
        userId
      );

      res.json(
        successResponse(notification, 'Notification acknowledged successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get unread notification count
   * GET /api/notifications/unread-count
   */
  getUnreadCount = async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;

      const count = await this.categoryNotificationService.getUnreadCount(
        tenantId,
        userId
      );

      res.json(
        successResponse(count, 'Unread notification count retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Send notification to category followers
   * POST /api/notifications/categories/:categoryId/followers
   */
  sendToCategoryFollowers = async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { categoryId } = req.params;
      const { title, message, type, priority, metadata } = req.body;

      const notification = await this.categoryNotificationService.sendNotificationToCategoryFollowers(
        tenantId,
        categoryId,
        title,
        message,
        type,
        priority,
        userId,
        metadata
      );

      res.status(201).json(
        successResponse(notification, 'Notification sent to category followers successfully', 201)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk send notifications to multiple categories
   * POST /api/notifications/categories/bulk-send
   */
  bulkSendToCategories = async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const senderId = req.user!.id;
      const { categoryIds, title, message, type, priority, recipientIds, metadata } = req.body;

      const notifications = await this.categoryNotificationService.bulkSendToCategories(
        tenantId,
        categoryIds,
        title,
        message,
        type,
        priority,
        senderId,
        recipientIds,
        metadata
      );

      res.status(201).json(
        successResponse(notifications, `${notifications.length} notifications sent successfully`, 201)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a notification
   * DELETE /api/notifications/:id
   */
  deleteNotification = async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const userId = req.user!.id;
      const { id } = req.params;

      await this.categoryNotificationService.deleteNotification(
        tenantId,
        id,
        userId
      );

      res.json(
        successResponse(null, 'Notification deleted successfully')
      );
    } catch (error) {
      next(error);
    }
  };
}