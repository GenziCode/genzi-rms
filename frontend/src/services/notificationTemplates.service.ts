import api from '@/lib/api';
import type { NotificationChannel } from './notifications.service';

export interface NotificationTemplateVersion {
  version: number;
  channels: NotificationChannel[];
  subject?: string;
  content: string;
  variables: string[];
  changeSummary?: string;
  createdBy: string;
  createdAt: string;
}

export interface NotificationTemplate {
  _id: string;
  name: string;
  key: string;
  description?: string;
  category?: string;
  tags: string[];
  channels: NotificationChannel[];
  defaultSubject?: string;
  samplePayload?: Record<string, unknown>;
  currentVersion: number;
  versions: NotificationTemplateVersion[];
  updatedAt: string;
  createdAt: string;
}

export interface NotificationTemplateListResponse {
  records: NotificationTemplate[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateNotificationTemplateRequest {
  name: string;
  key: string;
  description?: string;
  category?: string;
  tags?: string[];
  channels: NotificationChannel[];
  subject?: string;
  content: string;
  samplePayload?: Record<string, unknown>;
  changeSummary?: string;
}

export interface UpdateNotificationTemplateRequest
  extends Partial<CreateNotificationTemplateRequest> {}

export const notificationTemplatesService = {
  async list(params?: {
    search?: string;
    channel?: NotificationChannel;
    page?: number;
    limit?: number;
  }): Promise<NotificationTemplateListResponse> {
    const response = await api.get<{ data: NotificationTemplateListResponse }>(
      '/notification-templates',
      { params }
    );
    return response.data.data;
  },

  async getById(id: string): Promise<NotificationTemplate> {
    const response = await api.get<{ data: NotificationTemplate }>(
      `/notification-templates/${id}`
    );
    return response.data.data;
  },

  async create(payload: CreateNotificationTemplateRequest): Promise<NotificationTemplate> {
    const response = await api.post<{ data: NotificationTemplate }>('/notification-templates', payload);
    return response.data.data;
  },

  async update(
    id: string,
    payload: UpdateNotificationTemplateRequest
  ): Promise<NotificationTemplate> {
    const response = await api.put<{ data: NotificationTemplate }>(`/notification-templates/${id}`, payload);
    return response.data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/notification-templates/${id}`);
  },

  async createVersion(
    id: string,
    payload: { content: string; subject?: string; channels?: NotificationChannel[]; changeSummary?: string }
  ): Promise<NotificationTemplate> {
    const response = await api.post<{ data: NotificationTemplate }>(`/notification-templates/${id}/version`, payload);
    return response.data.data;
  },

  async preview(payload: {
    templateId?: string;
    subject?: string;
    content?: string;
    data?: Record<string, unknown>;
  }): Promise<{ subject?: string; content: string; variables: string[] }> {
    const response = await api.post<{ data: { subject?: string; content: string; variables: string[] } }>(
      '/notification-templates/preview',
      payload
    );
    return response.data.data;
  },
};

