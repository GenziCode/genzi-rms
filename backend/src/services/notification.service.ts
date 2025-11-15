import mongoose, { FilterQuery } from 'mongoose';
import { getTenantConnection } from '../config/database';
import {
  INotification,
  NotificationSchema,
  NotificationStatus,
  NotificationChannel,
} from '../models/notification.model';
import {
  INotificationRoute,
  NotificationRouteSchema,
} from '../models/notificationRoute.model';
import {
  INotificationPreference,
  NotificationPreferenceSchema,
} from '../models/notificationPreference.model';
import {
  INotificationInbox,
  NotificationInboxSchema,
  NotificationSeverity,
} from '../models/notificationInbox.model';
import { BadRequestError, NotFoundError } from '../utils/appError';
import { channelAdapters } from './notificationProviders';
import { logger } from '../utils/logger';

export interface NotificationRecipientInput {
  userId?: string;
  email?: string;
  phone?: string;
  webhookUrl?: string;
  name?: string;
}

export interface CreateNotificationPayload {
  eventKey: string;
  templateId?: string;
  channels: NotificationChannel[];
  recipients: NotificationRecipientInput[];
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  inboxOnly?: boolean;
}

export interface ListNotificationFilters {
  status?: NotificationStatus;
  eventKey?: string;
  channel?: NotificationChannel;
  limit?: number;
  page?: number;
}

export interface UpsertRoutePayload {
  eventKey: string;
  channels: Array<{
    channel: NotificationChannel;
    enabled: boolean;
    quietHours?: { start: string; end: string };
    fallback?: NotificationChannel[];
  }>;
  filters?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface UpdatePreferencesPayload {
  channels: Partial<
    Record<
      NotificationChannel,
      {
        enabled: boolean;
        quietHours?: { start: string; end: string };
      }
    >
  >;
}

export interface ListInboxFilters {
  read?: boolean;
  channel?: NotificationChannel;
  search?: string;
  includeArchived?: boolean;
  page?: number;
  limit?: number;
}

class NotificationService {
  private readonly INBOX_USER_LIMIT = 200;

  private async notificationModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<INotification>('Notification', NotificationSchema);
  }

  private async routeModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<INotificationRoute>('NotificationRoute', NotificationRouteSchema);
  }

  private async preferenceModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<INotificationPreference>(
      'NotificationPreference',
      NotificationPreferenceSchema
    );
  }

  private async inboxModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<INotificationInbox>('NotificationInbox', NotificationInboxSchema);
  }

  async createNotification(
    tenantId: string,
    payload: CreateNotificationPayload,
    createdBy?: string
  ) {
    if (!payload.recipients?.length) {
      throw new BadRequestError('At least one recipient is required');
    }
    const Notification = await this.notificationModel(tenantId);
    const doc = await Notification.create({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      eventKey: payload.eventKey,
      templateId: payload.templateId ? new mongoose.Types.ObjectId(payload.templateId) : undefined,
      channels: payload.channels,
      recipients: payload.recipients.map((recipient) => ({
        user: recipient.userId ? new mongoose.Types.ObjectId(recipient.userId) : undefined,
        email: recipient.email,
        phone: recipient.phone,
        webhookUrl: recipient.webhookUrl,
        name: recipient.name,
      })),
      payload: payload.payload ?? {},
      metadata: payload.metadata,
      inboxOnly: payload.inboxOnly ?? false,
      createdBy: createdBy ? new mongoose.Types.ObjectId(createdBy) : undefined,
      status: payload.inboxOnly ? 'delivered' : 'pending',
      deliveredAt: payload.inboxOnly ? new Date() : undefined,
    });

    await this.createInboxEntries(tenantId, doc);

    if (!payload.inboxOnly) {
      await this.dispatchNotification(tenantId, doc);
    }

    return doc;
  }

  async listNotifications(tenantId: string, filters: ListNotificationFilters = {}) {
    const Notification = await this.notificationModel(tenantId);
    const query: FilterQuery<INotification> = {};

    if (filters.status) query.status = filters.status;
    if (filters.eventKey) query.eventKey = filters.eventKey;
    if (filters.channel) query.channels = filters.channel;

    const limit = Math.min(filters.limit ?? 25, 100);
    const page = Math.max(filters.page ?? 1, 1);

    const [records, total] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Notification.countDocuments(query),
    ]);

    return {
      records,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getNotificationById(tenantId: string, id: string) {
    const Notification = await this.notificationModel(tenantId);
    const notification = await Notification.findById(id);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }
    return notification;
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status: NotificationStatus,
    metadata?: { deliveredAt?: Date; error?: string }
  ) {
    const Notification = await this.notificationModel(tenantId);
    const notification = await Notification.findById(id);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }
    notification.status = status;
    if (metadata?.deliveredAt) notification.deliveredAt = metadata.deliveredAt;
    if (metadata?.error) notification.lastError = metadata.error;
    notification.lastAttemptAt = new Date();
    notification.attempts += 1;
    await notification.save();
    return notification;
  }

  async upsertRoute(
    tenantId: string,
    payload: UpsertRoutePayload,
    updatedBy?: string
  ) {
    const Route = await this.routeModel(tenantId);
    const route = await Route.findOneAndUpdate(
      {
        tenantId: new mongoose.Types.ObjectId(tenantId),
        eventKey: payload.eventKey,
      },
      {
        $set: {
          channels: payload.channels,
          filters: payload.filters,
          metadata: payload.metadata,
          updatedBy: updatedBy ? new mongoose.Types.ObjectId(updatedBy) : undefined,
        },
      },
      { new: true, upsert: true }
    );
    return route;
  }

  async listRoutes(tenantId: string) {
    const Route = await this.routeModel(tenantId);
    return Route.find().sort({ eventKey: 1 });
  }

  async listInbox(
    tenantId: string,
    userId: string,
    filters: ListInboxFilters = {}
  ): Promise<{
    records: INotificationInbox[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
    unreadCount: number;
  }> {
    const Inbox = await this.inboxModel(tenantId);
    const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const query: FilterQuery<INotificationInbox> = {
      tenantId: tenantObjectId,
      userId: userObjectId,
    };

    if (!filters.includeArchived) {
      query.archived = false;
    }
    if (typeof filters.read === 'boolean') {
      query.read = filters.read;
    }
    if (filters.channel) {
      query.channels = filters.channel;
    }
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { message: { $regex: filters.search, $options: 'i' } },
        { eventKey: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const limit = Math.min(filters.limit ?? 25, 100);
    const page = Math.max(filters.page ?? 1, 1);

    const [records, total, unreadCount] = await Promise.all([
      Inbox.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Inbox.countDocuments(query),
      Inbox.countDocuments({
        tenantId: tenantObjectId,
        userId: userObjectId,
        read: false,
        archived: false,
      }),
    ]);

    return {
      records,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    };
  }

  async markInboxRead(tenantId: string, userId: string, id: string, read = true) {
    const Inbox = await this.inboxModel(tenantId);
    const item = await Inbox.findOneAndUpdate(
      {
        _id: id,
        tenantId: new mongoose.Types.ObjectId(tenantId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      {
        $set: {
          read,
          readAt: read ? new Date() : undefined,
        },
      },
      { new: true }
    );

    if (!item) {
      throw new NotFoundError('Inbox notification not found');
    }

    return item;
  }

  async markAllInboxRead(tenantId: string, userId: string): Promise<number> {
    const Inbox = await this.inboxModel(tenantId);
    const result = await Inbox.updateMany(
      {
        tenantId: new mongoose.Types.ObjectId(tenantId),
        userId: new mongoose.Types.ObjectId(userId),
        read: false,
        archived: false,
      },
      {
        $set: {
          read: true,
          readAt: new Date(),
        },
      }
    );
    return result.modifiedCount ?? 0;
  }

  async removeInboxItem(tenantId: string, userId: string, id: string): Promise<void> {
    const Inbox = await this.inboxModel(tenantId);
    const result = await Inbox.updateOne(
      {
        _id: id,
        tenantId: new mongoose.Types.ObjectId(tenantId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      { $set: { archived: true } }
    );

    if (result.matchedCount === 0) {
      throw new NotFoundError('Inbox notification not found');
    }
  }

  async getPreferences(tenantId: string, userId: string) {
    const Preference = await this.preferenceModel(tenantId);
    const preference =
      (await Preference.findOne({
        tenantId: new mongoose.Types.ObjectId(tenantId),
        userId: new mongoose.Types.ObjectId(userId),
      })) ??
      (await Preference.create({
        tenantId: new mongoose.Types.ObjectId(tenantId),
        userId: new mongoose.Types.ObjectId(userId),
      }));
    return preference;
  }

  async updatePreferences(
    tenantId: string,
    userId: string,
    payload: UpdatePreferencesPayload
  ) {
    const Preference = await this.preferenceModel(tenantId);
    const preference = await Preference.findOneAndUpdate(
      {
        tenantId: new mongoose.Types.ObjectId(tenantId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      {
        $set: {
          channels: payload.channels,
        },
      },
      { new: true, upsert: true }
    );
    return preference;
  }

  private async dispatchNotification(tenantId: string, notification: INotification) {
    const recipients = notification.recipients ?? [];
    const preferences = await this.getRecipientPreferencesMap(tenantId, recipients);

    let successCount = 0;
    let lastError: string | undefined;

    for (const channel of notification.channels) {
      const adapter = channelAdapters[channel];
      if (!adapter) {
        logger.warn(`No adapter registered for channel ${channel}`);
        continue;
      }

      for (const recipient of recipients) {
        if (this.shouldSkipRecipientChannel(channel, recipient, preferences)) {
          continue;
        }

        try {
          const result = await adapter.send({
            tenantId,
            notification,
            recipient,
          });
          if (result.success) {
            successCount += 1;
          } else {
            lastError = result.error;
          }
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown provider error';
          logger.error(`Failed to dispatch ${channel} notification`, {
            notificationId: notification._id,
            error: lastError,
          });
        }
      }
    }

    notification.attempts += 1;
    notification.lastAttemptAt = new Date();
    if (successCount > 0) {
      notification.status = 'delivered';
      notification.deliveredAt = new Date();
      notification.lastError = undefined;
    } else {
      notification.status = 'failed';
      notification.lastError = lastError ?? 'No valid recipients';
    }
    await notification.save();
  }

  private async getRecipientPreferencesMap(
    tenantId: string,
    recipients: INotification['recipients']
  ) {
    const userIds = recipients
      .map((recipient) => recipient.user?.toString())
      .filter((value): value is string => Boolean(value));
    if (userIds.length === 0) {
      return new Map<string, INotificationPreference>();
    }
    const Preference = await this.preferenceModel(tenantId);
    const docs = await Preference.find({
      userId: { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) },
    });
    const map = new Map<string, INotificationPreference>();
    docs.forEach((doc) => map.set(doc.userId.toString(), doc));
    return map;
  }

  private shouldSkipRecipientChannel(
    channel: NotificationChannel,
    recipient: INotification['recipients'][number],
    preferences: Map<string, INotificationPreference>
  ) {
    if (!recipient.user) return false;
    const preference = preferences.get(recipient.user.toString());
    if (!preference) return false;
    const channelPref = preference.channels?.[channel];
    if (channelPref && channelPref.enabled === false) {
      return true;
    }
    if (channelPref?.quietHours && this.isWithinQuietHours(channelPref.quietHours)) {
      return true;
    }
    return false;
  }

  private isWithinQuietHours(range?: { start?: string; end?: string }) {
    if (!range?.start || !range?.end) return false;
    const parseMinutes = (value: string) => {
      const [hours, minutes] = value.split(':').map((part) => parseInt(part, 10));
      if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
      return hours * 60 + minutes;
    };
    const start = parseMinutes(range.start);
    const end = parseMinutes(range.end);
    if (start === null || end === null) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (start <= end) {
      return currentMinutes >= start && currentMinutes <= end;
    }
    return currentMinutes >= start || currentMinutes <= end;
  }

  private getInboxTitle(notification: INotification): string {
    if (typeof notification.metadata?.title === 'string') {
      return notification.metadata.title;
    }
    if (typeof notification.payload?.title === 'string') {
      return notification.payload.title;
    }
    const parts = notification.eventKey.split(/[\._]/).filter(Boolean);
    return parts.length
      ? parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
      : 'Notification';
  }

  private getInboxMessage(notification: INotification): string {
    if (typeof notification.metadata?.message === 'string') {
      return notification.metadata.message;
    }
    if (typeof notification.payload?.message === 'string') {
      return notification.payload.message;
    }
    try {
      return JSON.stringify(notification.payload ?? {}, null, 2);
    } catch (error) {
      return 'Notification triggered';
    }
  }

  private getInboxSeverity(notification: INotification): NotificationSeverity {
    const severity =
      (notification.metadata?.severity as NotificationSeverity | undefined) ??
      (notification.payload?.severity as NotificationSeverity | undefined);
    if (severity && ['info', 'success', 'warning', 'error'].includes(severity)) {
      return severity;
    }
    return 'info';
  }

  private async createInboxEntries(tenantId: string, notification: INotification) {
    if (!notification.recipients?.length) {
      return;
    }

    const Inbox = await this.inboxModel(tenantId);
    const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
    const title = this.getInboxTitle(notification);
    const message = this.getInboxMessage(notification);
    const severity = this.getInboxSeverity(notification);

    const entries = notification.recipients
      .filter((recipient) => recipient.user)
      .map((recipient) => ({
        tenantId: tenantObjectId,
        userId: recipient.user as mongoose.Types.ObjectId,
        notificationId: notification._id,
        eventKey: notification.eventKey,
        title,
        message,
        channels: notification.channels,
        payload: notification.payload,
        metadata: notification.metadata,
        actionUrl:
          (notification.metadata?.actionUrl as string | undefined) ??
          (notification.payload?.actionUrl as string | undefined),
        severity,
        read: notification.inboxOnly ? true : false,
        readAt: notification.inboxOnly ? new Date() : undefined,
        deliveredAt: notification.deliveredAt ?? new Date(),
        archived: false,
      }));

    if (!entries.length) {
      return;
    }

    await Inbox.insertMany(entries, { ordered: false }).catch((error) => {
      logger.error('Failed to insert inbox entries', error);
    });

    const uniqueUserIds = Array.from(new Set(entries.map((entry) => entry.userId.toString())));
    await Promise.all(
      uniqueUserIds.map((userId) => this.enforceInboxLimit(tenantId, userId, Inbox))
    );
  }

  private async enforceInboxLimit(
    tenantId: string,
    userId: string,
    Inbox?: mongoose.Model<INotificationInbox>
  ) {
    const Model = Inbox ?? (await this.inboxModel(tenantId));
    const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const count = await Model.countDocuments({
      tenantId: tenantObjectId,
      userId: userObjectId,
      archived: false,
    });

    if (count <= this.INBOX_USER_LIMIT) {
      return;
    }

    const excess = count - this.INBOX_USER_LIMIT;
    const staleItems = await Model.find({
      tenantId: tenantObjectId,
      userId: userObjectId,
      archived: false,
    })
      .sort({ createdAt: 1 })
      .limit(excess)
      .select('_id');

    if (!staleItems.length) {
      return;
    }

    await Model.updateMany(
      { _id: { $in: staleItems.map((item) => item._id) } },
      { $set: { archived: true } }
    );
  }
}

export const notificationService = new NotificationService();

