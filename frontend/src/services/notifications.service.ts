import api from '@/lib/api';
import type {
  Notification,
  NotificationType,
  NotificationPreferences,
} from '@/types/notification.types';

export const notificationsService = {
  /**
   * Get all notifications for current user
   */
  async getAll(filters?: {
    type?: NotificationType;
    read?: boolean;
    page?: number;
    limit?: number;
  }) {
    const params = filters
      ? Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => {
            if (value === undefined || value === null) {
              return false;
            }
            return typeof value === 'string' ? value.trim().length > 0 : true;
          })
        )
      : undefined;

    const response = await api.get<{
      data: {
        notifications: Notification[];
        unreadCount: number;
        pagination: any;
      };
    }>('/notifications', { params });
    return response.data.data;
  },

  /**
   * Get notification by ID
   */
  async getById(id: string) {
    const response = await api.get<{ data: { notification: Notification } }>(
      `/notifications/${id}`
    );
    return response.data.data.notification;
  },

  /**
   * Mark notification as read
   */
  async markAsRead(id: string) {
    const response = await api.patch<{ data: { notification: Notification } }>(
      `/notifications/${id}/read`
    );
    return response.data.data.notification;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    const response = await api.patch<{ data: { count: number } }>(
      '/notifications/read-all'
    );
    return response.data.data.count;
  },

  /**
   * Delete notification
   */
  async delete(id: string) {
    await api.delete(`/notifications/${id}`);
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
