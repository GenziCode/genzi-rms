import api from '@/lib/api';
import type {
  InboxNotification,
  NotificationPreferences,
  NotificationType,
} from '@/types/notification.types';

export type NotificationChannel = 'email' | 'sms' | 'webhook' | 'in_app';

export type NotificationStatus =
  | 'pending'
  | 'scheduled'
  | 'sending'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface NotificationRecipient {
  user?: string;
  email?: string;
  phone?: string;
  webhookUrl?: string;
  name?: string;
}

export interface NotificationLog {
  _id: string;
  eventKey: string;
  templateId?: string;
  channels: NotificationChannel[];
  recipients: NotificationRecipient[];
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  status: NotificationStatus;
  attempts: number;
  lastAttemptAt?: string;
  deliveredAt?: string;
  lastError?: string;
  inboxOnly?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLogListResponse {
  records: NotificationLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateNotificationLogRequest {
  eventKey: string;
  channels: NotificationChannel[];
  recipients: Array<{
    userId?: string;
    email?: string;
    phone?: string;
    webhookUrl?: string;
    name?: string;
  }>;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  inboxOnly?: boolean;
}

export interface NotificationRouteConfig {
  _id: string;
  eventKey: string;
  channels: Array<{
    channel: NotificationChannel;
    enabled: boolean;
    quietHours?: {
      start: string;
      end: string;
    };
    fallback?: NotificationChannel[];
  }>;
  filters?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  updatedAt: string;
}

export const notificationAdminService = {
  async list(params?: {
    status?: NotificationStatus;
    eventKey?: string;
    channel?: NotificationChannel;
    page?: number;
    limit?: number;
  }): Promise<NotificationLogListResponse> {
    const response = await api.get<{ data: NotificationLogListResponse }>('/notifications', {
      params,
    });
    return response.data.data;
  },

  async create(payload: CreateNotificationLogRequest): Promise<NotificationLog> {
    const response = await api.post<{ data: NotificationLog }>('/notifications', payload);
    return response.data.data;
  },

  async updateStatus(
    id: string,
    payload: { status: NotificationStatus; deliveredAt?: string; error?: string }
  ): Promise<NotificationLog> {
    const response = await api.patch<{ data: NotificationLog }>(
      `/notifications/${id}/status`,
      payload
    );
    return response.data.data;
  },

  async listRoutes(): Promise<NotificationRouteConfig[]> {
    const response = await api.get<{ data: NotificationRouteConfig[] }>(
      '/notifications/routes/list'
    );
    return response.data.data;
  },

  async upsertRoute(payload: {
    eventKey: string;
    channels: NotificationRouteConfig['channels'];
    filters?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<NotificationRouteConfig> {
    const response = await api.post<{ data: NotificationRouteConfig }>(
      '/notifications/routes',
      payload
    );
    return response.data.data;
  },
};

export const notificationsService = {
  /**
   * Get inbox notifications for current user
   */
  async listInbox(params?: {
    read?: boolean;
    channel?: NotificationChannel;
    search?: string;
    includeArchived?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    records: InboxNotification[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
    unreadCount: number;
  }> {
    const response = await api.get<{
      data: {
        records: InboxNotification[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
        unreadCount: number;
      };
    }>('/notifications/inbox', { params });
    return response.data.data;
  },

  /**
   * Mark inbox notification as read/unread
   */
  async markInboxRead(id: string, read = true): Promise<InboxNotification> {
    const response = await api.patch<{ data: InboxNotification }>(
      `/notifications/inbox/${id}/read`,
      { read }
    );
    return response.data.data;
  },

  /**
   * Mark all inbox notifications as read
   */
  async markAllInboxRead(): Promise<number> {
    const response = await api.patch<{ data: { count: number } }>(
      '/notifications/inbox/read-all'
    );
    return response.data.data.count;
  },

  /**
   * Remove inbox notification
   */
  async deleteInboxItem(id: string): Promise<void> {
    await api.delete(`/notifications/inbox/${id}`);
  },

  /**
   * Get preferences
   */
  async getPreferences() {
    const response = await api.get<{
      data: { preferences: NotificationPreferences };
    }>('/notifications/preferences');
    return response.data.data.preferences;
  },

  /**
   * Update preferences
   */
  async updatePreferences(preferences: NotificationPreferences) {
    const response = await api.put<{
      data: { preferences: NotificationPreferences };
    }>('/notifications/preferences', preferences);
    return response.data.data.preferences;
  },

  /**
   * Broadcast notification
   */
  async broadcast(payload: {
    title: string;
    message: string;
    type?: NotificationType;
    channels: Array<'in_app' | 'email' | 'sms' | 'push'>;
    actionUrl?: string;
  }) {
    const response = await api.post<{
      data: { queued: number; targetCount: number };
    }>('/notifications/broadcast', payload);
    return response.data.data;
  },

  /**
   * Send test email
   */
  async testEmail(email: string) {
    const response = await api.post<{ data: { success: boolean } }>(
      '/notifications/test-email',
      { email }
    );
    return response.data.data.success;
  },

  /**
   * Send test SMS
   */
  async testSMS(phone: string) {
    const response = await api.post<{ data: { success: boolean } }>(
      '/notifications/test-sms',
      { phone }
    );
    return response.data.data.success;
  },
};
