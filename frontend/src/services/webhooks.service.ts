import api from '@/lib/api';

interface WebhookConfig {
  _id: string;
  tenantId: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  maxRetries: number;
  retryDelay: number;
  deliveryCount: number;
  failureCount: number;
  lastDeliveryAt?: string;
  lastDeliveryStatus?: 'success' | 'failed';
  createdAt: string;
  updatedAt: string;
}

interface WebhookLog {
  _id: string;
  webhookId: string;
  event: string;
  payload: Record<string, any>;
  response?: {
    status: number;
    body: any;
  };
  success: boolean;
  attempts: number;
  errorMessage?: string;
  deliveredAt?: string;
  createdAt: string;
}

export const webhooksService = {
  /**
   * Get all webhooks
   */
  async getAll(filters?: {
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const response = await api.get<{
      data: {
        webhooks: WebhookConfig[];
        pagination?: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      };
    }>('/webhooks-config', { params: filters });
    return response.data.data;
  },

  /**
   * Get webhook by ID
   */
  async getById(id: string) {
    const response = await api.get<{ data: { webhook: WebhookConfig } }>(
      `/webhooks-config/${id}`
    );
    return response.data.data.webhook;
  },

  /**
   * Create new webhook
   */
  async create(data: {
    name: string;
    url: string;
    events: string[];
    maxRetries?: number;
  }) {
    const response = await api.post<{ data: { webhook: WebhookConfig } }>(
      '/webhooks-config',
      data
    );
    return response.data.data.webhook;
  },

  /**
   * Update webhook
   */
  async update(id: string, data: Partial<WebhookConfig>) {
    const response = await api.put<{ data: { webhook: WebhookConfig } }>(
      `/webhooks-config/${id}`,
      data
    );
    return response.data.data.webhook;
  },

  /**
   * Delete webhook
   */
  async delete(id: string) {
    await api.delete(`/webhooks-config/${id}`);
  },

  /**
   * Get webhook delivery logs
   */
  async getLogs(
    id: string,
    filters?: {
      success?: boolean;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const response = await api.get<{
      data: {
        logs: WebhookLog[];
        pagination?: any;
      };
    }>(`/webhooks-config/${id}/logs`, { params: filters });
    return response.data.data;
  },

  /**
   * Test webhook
   */
  async test(id: string) {
    const response = await api.post<{
      data: {
        success: boolean;
        response?: any;
        error?: string;
      };
    }>(`/webhooks-config/${id}/test`);
    return response.data.data;
  },

  /**
   * Toggle webhook active status
   */
  async toggleActive(id: string, active: boolean) {
    const response = await api.patch<{ data: { webhook: WebhookConfig } }>(
      `/webhooks-config/${id}/toggle`,
      { active }
    );
    return response.data.data.webhook;
  },
};

export type { WebhookConfig, WebhookLog };
