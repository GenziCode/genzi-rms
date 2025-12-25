import { getTenantConnection } from '../config/database';
import { CategoryNotificationSchema, ICategoryNotification } from '../models/categoryNotification.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import { ICategory } from '../models/category.model';

export class CategoryNotificationService {
  private async getCategoryNotificationModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<ICategoryNotification>('CategoryNotification', CategoryNotificationSchema);
  }

  /**
   * Create a new category notification
   */
  async createNotification(
    tenantId: string,
    userId: string,
    categoryId: string,
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'success' = 'info',
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    recipientIds: string[],
    scheduledAt?: Date,
    expiresAt?: Date,
    metadata?: Record<string, any>
  ): Promise<ICategoryNotification> {
    try {
      const Notification = await this.getCategoryNotificationModel(tenantId);

      // Validate that category exists
      const categoryService = new (await import('./category.service')).CategoryService();
      const categoryModel = await categoryService.getCategoryModel(tenantId);
      const category = await categoryModel.findById(categoryId);
      if (!category) {
        throw new AppError('Category not found', 404);
      }

      // Validate that recipients exist
      const connection = await getTenantConnection(tenantId);
      const User = connection.model('User');
      const users = await User.find({ _id: { $in: recipientIds } });
      if (users.length !== recipientIds.length) {
        throw new AppError('One or more recipients not found', 404);
      }

      const notification = new Notification({
        category: categoryId,
        title,
        message,
        type,
        priority,
        sender: userId,
        recipients: recipientIds.map(id => ({ user: id })),
        scheduledAt,
        expiresAt,
        metadata,
      });

      await notification.save();

      logger.info(`Category notification created: ${notification._id} for category ${categoryId}`);
      return notification;
    } catch (error) {
      logger.error('Error creating category notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a specific category
   */
  async getCategoryNotifications(
    tenantId: string,
    categoryId: string,
    options: {
      type?: 'info' | 'warning' | 'error' | 'success';
      priority?: 'low' | 'medium' | 'high' | 'critical';
      limit?: number;
      page?: number;
      sortBy?: 'createdAt' | 'sentAt' | 'priority';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    notifications: ICategoryNotification[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const Notification = await this.getCategoryNotificationModel(tenantId);

      const { 
        type, 
        priority, 
        limit = 50, 
        page = 1, 
        sortBy = 'sentAt', 
        sortOrder = 'desc' 
      } = options;

      // Build query
      const query: any = { category: categoryId };
      if (type) query.type = type;
      if (priority) query.priority = priority;

      // Count total
      const total = await Notification.countDocuments(query);

      // Build sort
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Get notifications
      const notifications = await Notification.find(query)
        .populate('sender', 'name email')
        .populate('recipients.user', 'name email')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit);

      return {
        notifications,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error getting category notifications:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a specific user
   */
  async getUserNotifications(
    tenantId: string,
    userId: string,
    options: {
      type?: 'info' | 'warning' | 'error' | 'success';
      priority?: 'low' | 'medium' | 'high' | 'critical';
      isRead?: boolean;
      isAcknowledged?: boolean;
      limit?: number;
      page?: number;
      sortBy?: 'createdAt' | 'sentAt' | 'priority';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    notifications: ICategoryNotification[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const Notification = await this.getCategoryNotificationModel(tenantId);

      const { 
        type, 
        priority, 
        isRead, 
        isAcknowledged,
        limit = 50, 
        page = 1, 
        sortBy = 'sentAt', 
        sortOrder = 'desc' 
      } = options;

      // Build query - look for notifications where the user is in the recipients list
      const query: any = { 'recipients.user': userId };
      if (type) query.type = type;
      if (priority) query.priority = priority;
      if (isRead !== undefined) {
        query['recipients.readAt'] = isRead ? { $exists: true, $ne: null } : { $exists: false };
      }
      if (isAcknowledged !== undefined) {
        query['recipients.acknowledgedAt'] = isAcknowledged ? { $exists: true, $ne: null } : { $exists: false };
      }

      // Count total
      const total = await Notification.countDocuments(query);

      // Build sort
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Get notifications
      const notifications = await Notification.find(query)
        .populate('category', 'name')
        .populate('sender', 'name email')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit);

      return {
        notifications,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(
    tenantId: string,
    notificationId: string,
    userId: string
  ): Promise<ICategoryNotification> {
    try {
      const Notification = await this.getCategoryNotificationModel(tenantId);

      const notification = await Notification.findById(notificationId);
      if (!notification) {
        throw new AppError('Notification not found', 404);
      }

      // Check if user is a recipient
      const recipientIndex = notification.recipients.findIndex(
        r => r.user.toString() === userId
      );
      if (recipientIndex === -1) {
        throw new AppError('User is not a recipient of this notification', 403);
      }

      // Mark as read if not already marked
      if (!notification.recipients[recipientIndex].readAt) {
        notification.recipients[recipientIndex].readAt = new Date();
        
        // If all recipients have read the notification, mark the main isRead flag
        const allRead = notification.recipients.every(r => r.readAt);
        if (allRead) {
          notification.isRead = true;
        }
      }

      await notification.save();

      logger.info(`Notification marked as read: ${notificationId} by user ${userId}`);
      return notification;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Acknowledge a notification
   */
  async acknowledge(
    tenantId: string,
    notificationId: string,
    userId: string
  ): Promise<ICategoryNotification> {
    try {
      const Notification = await this.getCategoryNotificationModel(tenantId);

      const notification = await Notification.findById(notificationId);
      if (!notification) {
        throw new AppError('Notification not found', 404);
      }

      // Check if user is a recipient
      const recipientIndex = notification.recipients.findIndex(
        r => r.user.toString() === userId
      );
      if (recipientIndex === -1) {
        throw new AppError('User is not a recipient of this notification', 403);
      }

      // Mark as acknowledged if not already marked
      if (!notification.recipients[recipientIndex].acknowledgedAt) {
        notification.recipients[recipientIndex].acknowledgedAt = new Date();
        
        // If all recipients have acknowledged the notification, mark the main isAcknowledged flag
        const allAcknowledged = notification.recipients.every(r => r.acknowledgedAt);
        if (allAcknowledged) {
          notification.isAcknowledged = true;
        }
      }

      await notification.save();

      logger.info(`Notification acknowledged: ${notificationId} by user ${userId}`);
      return notification;
    } catch (error) {
      logger.error('Error acknowledging notification:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(tenantId: string, userId: string): Promise<number> {
    try {
      const Notification = await this.getCategoryNotificationModel(tenantId);

      const count = await Notification.countDocuments({
        'recipients.user': userId,
        'recipients.readAt': { $exists: false },
      });

      return count;
    } catch (error) {
      logger.error('Error getting unread notification count:', error);
      throw error;
    }
  }

  /**
   * Send notification to category followers/users
   */
  async sendNotificationToCategoryFollowers(
    tenantId: string,
    categoryId: string,
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'success' = 'info',
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    senderId: string,
    metadata?: Record<string, any>
  ): Promise<ICategoryNotification> {
    try {
      // In a real implementation, this would identify users who follow this category
      // For now, we'll send to all users in the tenant as an example
      const connection = await getTenantConnection(tenantId);
      const User = connection.model('User');
      
      // Get all users in the tenant (in a real app, this would be category followers)
      const users = await User.find({}, '_id');
      const recipientIds = users.map(user => user._id.toString());

      if (recipientIds.length === 0) {
        throw new AppError('No users found to notify', 404);
      }

      return this.createNotification(
        tenantId,
        senderId,
        categoryId,
        title,
        message,
        type,
        priority,
        recipientIds,
        undefined, // scheduledAt
        undefined, // expiresAt
        metadata
      );
    } catch (error) {
      logger.error('Error sending notification to category followers:', error);
      throw error;
    }
  }

  /**
   * Bulk send notifications to multiple categories
   */
  async bulkSendToCategories(
    tenantId: string,
    categoryIds: string[],
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'success' = 'info',
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    senderId: string,
    recipientIds: string[],
    metadata?: Record<string, any>
  ): Promise<ICategoryNotification[]> {
    try {
      const notifications: ICategoryNotification[] = [];

      for (const categoryId of categoryIds) {
        const notification = await this.createNotification(
          tenantId,
          senderId,
          categoryId,
          title,
          message,
          type,
          priority,
          recipientIds,
          undefined,
          undefined,
          metadata
        );
        notifications.push(notification);
      }

      logger.info(`Bulk sent ${notifications.length} notifications to ${categoryIds.length} categories`);
      return notifications;
    } catch (error) {
      logger.error('Error in bulk sending notifications:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(
    tenantId: string,
    notificationId: string,
    userId: string
  ): Promise<void> {
    try {
      const Notification = await this.getCategoryNotificationModel(tenantId);

      const notification = await Notification.findById(notificationId);
      if (!notification) {
        throw new AppError('Notification not found', 404);
      }

      // Only the sender can delete the notification
      if (notification.sender.toString() !== userId) {
        throw new AppError('Not authorized to delete this notification', 403);
      }

      await Notification.findByIdAndDelete(notificationId);

      logger.info(`Notification deleted: ${notificationId}`);
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw error;
    }
  }
}