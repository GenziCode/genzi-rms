import api from '@/lib/api';

interface AuditLog {
  _id: string;
  tenantId: string;
  userId?: string;
  user?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  snapshotBefore?: Record<string, any> | null;
  snapshotAfter?: Record<string, any> | null;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

interface AuditStatistics {
  totalLogs: number;
  byAction: {
    action: string;
    count: number;
  }[];
  byEntityType: {
    entityType: string;
    count: number;
  }[];
  byUser: {
    userId: string;
    userName: string;
    count: number;
  }[];
  recentActivity: AuditLog[];
}

export const auditService = {
  /**
   * Get all audit logs with filters
   */
  async getAll(filters?: {
    action?: string;
    entityType?: string;
    entityId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await api.get<{
      data: {
        logs: AuditLog[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      };
    }>('/audit-logs', { params: filters });
    return response.data.data;
  },

  /**
   * Get audit log by ID
   */
  async getById(id: string) {
    const response = await api.get<{ data: { log: AuditLog } }>(
      `/audit-logs/${id}`
    );
    return response.data.data.log;
  },

  /**
   * Get audit statistics
   */
  async getStatistics(filters?: { startDate?: string; endDate?: string }) {
    const response = await api.get<{
      data: {
        statistics: AuditStatistics;
      };
    }>('/audit-logs/statistics', { params: filters });
    return response.data.data.statistics;
  },

  /**
   * Export audit logs as CSV
   */
  async exportLogs(filters?: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    action?: string;
    entityType?: string;
  }) {
    const response = await api.get('/audit-logs/export', {
      params: filters,
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit-logs-${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return true;
  },

  /**
   * Get user activity logs
   */
  async getUserActivity(
    userId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const response = await api.get<{
      data: {
        logs: AuditLog[];
        pagination: any;
      };
    }>(`/audit-logs/user/${userId}`, { params: filters });
    return response.data.data;
  },

  /**
   * Get entity history
   */
  async getEntityHistory(
    entityType: string,
    entityId: string,
    filters?: {
      page?: number;
      limit?: number;
    }
  ) {
    const response = await api.get<{
      data: {
        logs: AuditLog[];
        pagination: any;
      };
    }>(`/audit-logs/entity/${entityType}/${entityId}`, { params: filters });
    return response.data.data;
  },
};

export type { AuditLog, AuditStatistics };
