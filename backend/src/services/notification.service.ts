import { getTenantConnection } from '../config/database';
import {
  NotificationSchema,
  INotification,
  NotificationType,
  NotificationChannel,
} from '../models/notification.model';
import { NotFoundError } from '../utils/appError';
import { logger } from '../utils/logger';
import { monitoringService } from '../utils/monitoring';
import { emailService } from '../utils/email';
import { smsService } from '../utils/sms';
import { SettingsService } from './settings.service';
import type { ISettings } from '../models/settings.model';

type PreferenceTypeKey =
  | 'sale'
  | 'payment'
  | 'inventory'
  | 'order'
  | 'customer'
  | 'alert'
  | 'reminder';

export class NotificationService {
  private settingsService = new SettingsService();

  private getDefaultPreferences() {
    return {
      inApp: true,
      email: false,
      sms: false,
      push: false,
      types: {
        sale: true,
        payment: true,
        inventory: true,
        order: true,
        customer: true,
        alert: true,
        reminder: true,
      },
    };
  }

  /**
   * Create notification
   */
  async create(
    tenantId: string,
    data: {
      userId?: string;
      type: NotificationType;
      channel: NotificationChannel;
      title: string;
      message: string;
      data?: Record<string, any>;
      entityType?: string;
      entityId?: string;
      actionUrl?: string;
      createdBy?: string;
    }
  ): Promise<INotification> {
    const tenantConn = await getTenantConnection(tenantId);
    const Notification = tenantConn.model<INotification>('Notification', NotificationSchema);

    const notification = new Notification({
      ...data,
      tenantId,
      deliveryStatus: 'pending',
    });

    await notification.save();

    const decision = await this.evaluateDelivery(tenantId, data.userId, data.type, data.channel);

    if (!decision.allowed) {
      notification.deliveryStatus = 'failed';
      notification.errorMessage = decision.reason;
      notification.sentAt = new Date();
      if (data.channel === 'in_app') {
        notification.read = true;
        notification.readAt = new Date();
      }
      await notification.save();

      monitoringService.trackNotificationFailure({
        tenantId,
        notificationId: notification._id.toString(),
        channel: data.channel,
        reason: decision.reason ?? 'not_allowed',
        payload: data,
      });

      logger.warn(
        `Notification delivery skipped: ${notification._id} - Reason: ${decision.reason}`
      );
      return notification;
    }

    // Send based on channel
    if (data.channel === 'email' && data.userId) {
      await this.sendEmailNotification(
        tenantId,
        notification._id.toString(),
        decision.emailConfig!,
        data
      );
    } else if (data.channel === 'sms' && data.userId) {
      await this.sendSMSNotification(
        tenantId,
        notification._id.toString(),
        decision.smsConfig!,
        data
      );
    } else if (data.channel === 'in_app') {
      notification.deliveryStatus = 'delivered';
      notification.sentAt = new Date();
      await notification.save();
    } else if (data.channel === 'push') {
      notification.deliveryStatus = 'pending';
      notification.sentAt = new Date();
      await notification.save();
    }

    logger.info(
      `Notification created: ${notification._id} - Type: ${data.type}, Channel: ${data.channel}`
    );

    return notification;
  }

  /**
   * Get all notifications for a user
   */
  async getAll(
    tenantId: string,
    userId: string,
    filters: {
      type?: NotificationType;
      read?: boolean;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const tenantConn = await getTenantConnection(tenantId);
    const Notification = tenantConn.model<INotification>('Notification', NotificationSchema);

    const query: any = {
      tenantId,
      $or: [
        { userId }, // User-specific
        { userId: null }, // System-wide
      ],
    };

    if (filters.type) query.type = filters.type;
    if (filters.read !== undefined) query.read = filters.read;

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ ...query, read: false }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get notification by ID
   */
  async getById(tenantId: string, notificationId: string): Promise<INotification> {
    const tenantConn = await getTenantConnection(tenantId);
    const Notification = tenantConn.model<INotification>('Notification', NotificationSchema);

    const notification = await Notification.findOne({ _id: notificationId, tenantId });

    if (!notification) {
      throw new NotFoundError('Notification');
    }

    return notification;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(tenantId: string, notificationId: string): Promise<INotification> {
    const tenantConn = await getTenantConnection(tenantId);
    const Notification = tenantConn.model<INotification>('Notification', NotificationSchema);

    const notification = await Notification.findOne({ _id: notificationId, tenantId });

    if (!notification) {
      throw new NotFoundError('Notification');
    }

    if (!notification.read) {
      notification.read = true;
      notification.readAt = new Date();
      await notification.save();
    }

    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(tenantId: string, userId: string): Promise<number> {
    const tenantConn = await getTenantConnection(tenantId);
    const Notification = tenantConn.model<INotification>('Notification', NotificationSchema);

    const result = await Notification.updateMany(
      { tenantId, userId, read: false },
      { read: true, readAt: new Date() }
    );

    logger.info(`Marked ${result.modifiedCount} notifications as read for user: ${userId}`);

    return result.modifiedCount;
  }

  /**
   * Delete notification
   */
  async delete(tenantId: string, notificationId: string): Promise<void> {
    const tenantConn = await getTenantConnection(tenantId);
    const Notification = tenantConn.model<INotification>('Notification', NotificationSchema);

    const result = await Notification.deleteOne({ _id: notificationId, tenantId });

    if (result.deletedCount === 0) {
      throw new NotFoundError('Notification');
    }

    logger.info(`Notification deleted: ${notificationId}`);
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    tenantId: string,
    notificationId: string,
    emailConfig: {
      host: string;
      port: number;
      secure: boolean;
      user: string;
      password: string;
      fromEmail?: string;
      replyTo?: string;
    },
    originalPayload: {
      channel: NotificationChannel;
      type: NotificationType;
      title: string;
      message: string;
      userId?: string;
      entityType?: string;
      entityId?: string;
      actionUrl?: string;
    }
  ): Promise<void> {
    const tenantConn = await getTenantConnection(tenantId);
    const Notification = tenantConn.model<INotification>('Notification', NotificationSchema);
    const User = tenantConn.model('User');

    const notification = await Notification.findById(notificationId);
    if (!notification || !notification.userId) return;

    const user = await User.findById(notification.userId);
    if (!user || !user.email) {
      notification.deliveryStatus = 'failed';
      notification.errorMessage = 'User email not found';
      await notification.save();
      return;
    }

    const start = Date.now();
    const success = await emailService.sendEmail({
      to: user.email,
      subject: notification.title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${notification.title}</h2>
          <p>${notification.message}</p>
          ${
            notification.actionUrl
              ? `<a href="${notification.actionUrl}" style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">View Details</a>`
              : ''
          }
        </div>
      `,
      transportOverride: {
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: {
          user: emailConfig.user,
          pass: emailConfig.password,
        },
        from: emailConfig.fromEmail || emailConfig.user,
        replyTo: emailConfig.replyTo,
      },
    });

    notification.deliveryStatus = success ? 'sent' : 'failed';
    notification.sentAt = new Date();
    if (!success) {
      notification.errorMessage = 'Failed to send email';
    }
    await notification.save();

    monitoringService.trackNotificationDelivery({
      tenantId,
      notificationId: notification._id.toString(),
      channel: 'email',
      durationMs: Date.now() - start,
      success,
      metadata: {
        userId: user._id.toString(),
        email: user.email,
        configHost: emailConfig.host,
      },
      payload: originalPayload,
      errorMessage: success ? undefined : notification.errorMessage,
    });
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(
    tenantId: string,
    notificationId: string,
    smsConfig: {
      provider: 'twilio';
      accountSid: string;
      authToken: string;
      fromNumber: string;
    },
    originalPayload: {
      channel: NotificationChannel;
      type: NotificationType;
      title: string;
      message: string;
      userId?: string;
      entityType?: string;
      entityId?: string;
      actionUrl?: string;
    }
  ): Promise<void> {
    const tenantConn = await getTenantConnection(tenantId);
    const Notification = tenantConn.model<INotification>('Notification', NotificationSchema);
    const User = tenantConn.model('User');

    const notification = await Notification.findById(notificationId);
    if (!notification || !notification.userId) return;

    const user = await User.findById(notification.userId);
    if (!user || !user.phone) {
      notification.deliveryStatus = 'failed';
      notification.errorMessage = 'User phone not found';
      await notification.save();
      return;
    }

    const start = Date.now();
    const success = await smsService.sendSMS(user.phone, notification.message, {
      provider: smsConfig.provider,
      accountSid: smsConfig.accountSid,
      authToken: smsConfig.authToken,
      fromNumber: smsConfig.fromNumber,
    });

    notification.deliveryStatus = success ? 'sent' : 'failed';
    notification.sentAt = new Date();
    if (!success) {
      notification.errorMessage = 'Failed to send SMS';
    }
    await notification.save();

    monitoringService.trackNotificationDelivery({
      tenantId,
      notificationId: notification._id.toString(),
      channel: 'sms',
      durationMs: Date.now() - start,
      success,
      metadata: {
        userId: user._id.toString(),
        phone: user.phone,
        provider: smsConfig.provider,
      },
      payload: originalPayload,
      errorMessage: success ? undefined : notification.errorMessage,
    });
  }

  /**
   * Broadcast notification to all users
   */
  async broadcast(
    tenantId: string,
    data: {
      type?: NotificationType;
      channels?: NotificationChannel[];
      title: string;
      message: string;
      actionUrl?: string;
      createdBy?: string;
    }
  ): Promise<{ queued: number; targetCount: number }> {
    const tenantConn = await getTenantConnection(tenantId);
    const User = tenantConn.model('User');

    // Get all active users for this tenant
    const users = await User.find({ tenantId, status: 'active' }).select('_id');

    const channels = Array.isArray(data.channels) && data.channels.length > 0
      ? Array.from(new Set(data.channels))
      : ['in_app'];

    let queued = 0;

    for (const channel of channels) {
      for (const user of users) {
        await this.create(tenantId, {
          type: data.type ?? 'system',
          channel,
          title: data.title,
          message: data.message,
          actionUrl: data.actionUrl,
          createdBy: data.createdBy,
          userId: user._id.toString(),
        });
        queued += 1;
      }
    }

    logger.info(
      `Broadcast queued: ${queued} notifications across ${users.length} users on channels ${channels.join(
        ', '
      )}`
    );

    return {
      queued,
      targetCount: users.length,
    };
  }

  async getPreferences(tenantId: string, userId: string) {
    const tenantConn = await getTenantConnection(tenantId);
    const User = tenantConn.model('User');

    const user = await User.findById(userId).select('notificationPreferences');
    if (!user) {
      logger.warn(
        `Notification preferences requested for missing user ${userId} (tenant ${tenantId}); returning defaults.`
      );
      return this.getDefaultPreferences();
    }

    if (!user.notificationPreferences) {
      const defaults = this.getDefaultPreferences();
      user.notificationPreferences = defaults;
      await user.save();
      return defaults;
    }

    const preferences = user.notificationPreferences;
    const defaults = this.getDefaultPreferences();
    return {
      inApp: preferences.inApp ?? defaults.inApp,
      email: preferences.email ?? defaults.email,
      sms: preferences.sms ?? defaults.sms,
      push: preferences.push ?? defaults.push,
      types: {
        sale: preferences.types?.sale ?? defaults.types.sale,
        payment: preferences.types?.payment ?? defaults.types.payment,
        inventory: preferences.types?.inventory ?? defaults.types.inventory,
        order: preferences.types?.order ?? defaults.types.order,
        customer: preferences.types?.customer ?? defaults.types.customer,
        alert: preferences.types?.alert ?? defaults.types.alert,
        reminder: preferences.types?.reminder ?? defaults.types.reminder,
      },
    };
  }

  async updatePreferences(
    tenantId: string,
    userId: string,
    preferences: {
      inApp?: boolean;
      email?: boolean;
      sms?: boolean;
      push?: boolean;
      types?: Partial<{
        sale: boolean;
        payment: boolean;
        inventory: boolean;
        order: boolean;
        customer: boolean;
        alert: boolean;
        reminder: boolean;
      }>;
    }
  ) {
    const tenantConn = await getTenantConnection(tenantId);
    const User = tenantConn.model('User');

    const user = await User.findById(userId).select('notificationPreferences');
    if (!user) {
      logger.warn(
        `Notification preferences update attempted for missing user ${userId} (tenant ${tenantId}); persisting defaults.`
      );
      const defaults = this.getDefaultPreferences();
      return {
        ...defaults,
        inApp: preferences.inApp ?? defaults.inApp,
        email: preferences.email ?? defaults.email,
        sms: preferences.sms ?? defaults.sms,
        push: preferences.push ?? defaults.push,
        types: {
          ...defaults.types,
          ...preferences.types,
        },
      };
    }

    const current = await this.getPreferences(tenantId, userId);
    const updated = {
      ...current,
      inApp: preferences.inApp ?? current.inApp,
      email: preferences.email ?? current.email,
      sms: preferences.sms ?? current.sms,
      push: preferences.push ?? current.push,
      types: {
        ...current.types,
        ...preferences.types,
      },
    };

    user.notificationPreferences = updated;
    await user.save();

    logger.info(`Notification preferences updated for user ${userId}`);

    return updated;
  }

  private mapTypeToPreferenceKey(type: NotificationType): PreferenceTypeKey | null {
    switch (type) {
      case 'sale':
      case 'payment':
      case 'inventory':
      case 'order':
      case 'customer':
      case 'alert':
      case 'reminder':
        return type;
      default:
        return null;
    }
  }

  private async evaluateDelivery(
    tenantId: string,
    userId: string | undefined,
    type: NotificationType,
    channel: NotificationChannel
  ): Promise<{
    allowed: boolean;
    reason?: string;
    emailConfig?: {
      host: string;
      port: number;
      secure: boolean;
      user: string;
      password: string;
      fromEmail?: string;
      replyTo?: string;
    };
    smsConfig?: {
      provider: 'twilio';
      accountSid: string;
      authToken: string;
      fromNumber: string;
    };
  }> {
    const decision: {
      allowed: boolean;
      reason?: string;
      emailConfig?: {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        password: string;
        fromEmail?: string;
        replyTo?: string;
      };
      smsConfig?: {
        provider: 'twilio';
        accountSid: string;
        authToken: string;
        fromNumber: string;
      };
    } = { allowed: true };

    const typeKey = this.mapTypeToPreferenceKey(type);
    const preferences = userId ? await this.getPreferences(tenantId, userId) : null;

    if (channel === 'in_app') {
      const channelEnabled = preferences ? preferences.inApp : true;
      const typeEnabled =
        !typeKey || !preferences ? true : preferences.types?.[typeKey] ?? true;

      if (!channelEnabled) {
        return { allowed: false, reason: 'In-app notifications disabled by user preference' };
      }

      if (!typeEnabled) {
        return {
          allowed: false,
          reason: `User disabled ${type} notifications in preferences`,
        };
      }

      return decision;
    }

    if (channel === 'push') {
      const channelEnabled = preferences ? preferences.push : false;
      const typeEnabled =
        !typeKey || !preferences ? true : preferences.types?.[typeKey] ?? true;

      if (!channelEnabled) {
        return { allowed: false, reason: 'Push notifications disabled by user preference' };
      }

      if (!typeEnabled) {
        return {
          allowed: false,
          reason: `User disabled ${type} notifications in preferences`,
        };
      }

      return decision;
    }

    if (channel === 'email') {
      const channelEnabled = preferences ? preferences.email : true;
      const typeEnabled =
        !typeKey || !preferences ? true : preferences.types?.[typeKey] ?? true;

      if (!channelEnabled) {
        return { allowed: false, reason: 'Email notifications disabled by user preference' };
      }

      if (!typeEnabled) {
        return {
          allowed: false,
          reason: `User disabled ${type} notifications in preferences`,
        };
      }
    }

    if (channel === 'sms') {
      const channelEnabled = preferences ? preferences.sms : true;
      const typeEnabled =
        !typeKey || !preferences ? true : preferences.types?.[typeKey] ?? true;

      if (!channelEnabled) {
        return { allowed: false, reason: 'SMS notifications disabled by user preference' };
      }

      if (!typeEnabled) {
        return {
          allowed: false,
          reason: `User disabled ${type} notifications in preferences`,
        };
      }
    }

    const communication = await this.getRawCommunicationConfig(tenantId);

    if (channel === 'email') {
      if (!communication.emailNotifications || !communication.emailConfig.enabled) {
        return {
          allowed: false,
          reason: 'Email notifications disabled in tenant communication settings',
        };
      }

      const emailConfig = communication.emailConfig;
      if (!emailConfig.host || !emailConfig.user || !emailConfig.password) {
        return {
          allowed: false,
          reason: 'Email configuration incomplete (host/user/password required)',
        };
      }

      decision.emailConfig = {
        host: emailConfig.host,
        port: emailConfig.port ?? 587,
        secure: emailConfig.secure ?? false,
        user: emailConfig.user,
        password: emailConfig.password,
        fromEmail: emailConfig.fromEmail,
        replyTo: emailConfig.replyTo,
      };
    }

    if (channel === 'sms') {
      if (!communication.smsNotifications || !communication.smsConfig.enabled) {
        return {
          allowed: false,
          reason: 'SMS notifications disabled in tenant communication settings',
        };
      }

      const smsConfig = communication.smsConfig;
      if (!smsConfig.accountSid || !smsConfig.authToken || !smsConfig.fromNumber) {
        return {
          allowed: false,
          reason: 'SMS configuration incomplete (account SID/auth token/from number required)',
        };
      }

      decision.smsConfig = {
        provider: smsConfig.provider,
        accountSid: smsConfig.accountSid,
        authToken: smsConfig.authToken,
        fromNumber: smsConfig.fromNumber,
      };
    }

    return decision;
  }

  private async getRawCommunicationConfig(tenantId: string) {
    const settings = await this.settingsService.getSettings(tenantId, 'Main Store');
    const notifications = settings.notifications;
    return {
      emailNotifications: notifications.emailNotifications ?? false,
      smsNotifications: notifications.smsNotifications ?? false,
      emailConfig: notifications.emailConfig || ({} as ISettings['notifications']['emailConfig']),
      smsConfig: notifications.smsConfig || ({} as ISettings['notifications']['smsConfig']),
    };
  }
}

export const notificationService = new NotificationService();

