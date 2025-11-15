import api from '@/lib/api';

export type ReportDeliveryChannel = 'email' | 'webhook' | 'inbox';

export interface ReportSchedule {
  _id: string;
  name: string;
  description?: string;
  reportType: string;
  templateId: string;
  format: 'pdf' | 'excel' | 'csv';
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  timezone: string;
  runAt: string;
  daysOfWeek?: string[];
  dayOfMonth?: number;
  startDate?: string;
  endDate?: string;
  nextRun?: string;
  lastRun?: string;
  delivery: {
    channels: ReportDeliveryChannel[];
    recipients?: string[];
    webhookUrl?: string;
  };
  filters?: Record<string, unknown>;
  isActive: boolean;
  stats?: {
    successCount: number;
    failureCount: number;
    lastStatus?: 'success' | 'failed' | 'pending';
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportScheduleRequest {
  name: string;
  description?: string;
  reportType: string;
  templateId: string;
  format: 'pdf' | 'excel' | 'csv';
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  timezone: string;
  runAt: string;
  daysOfWeek?: string[];
  dayOfMonth?: number;
  startDate: string;
  endDate?: string;
  delivery: {
    channels: ReportDeliveryChannel[];
    recipients?: string[];
    webhookUrl?: string;
  };
  filters?: Record<string, unknown>;
  isActive?: boolean;
}

export interface UpdateReportScheduleRequest
  extends Partial<CreateReportScheduleRequest> {
  reason?: string;
}

export interface ReportExecution {
  _id: string;
  scheduleId: string;
  reportType: string;
  startedAt: string;
  completedAt?: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  format: 'pdf' | 'excel' | 'csv';
  durationMs?: number;
  recipients?: string[];
  downloadUrl?: string;
  error?: string;
}

const formatErrorMessage = (error: unknown) => {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object' &&
    'error' in error.response.data
  ) {
    const typedError = error.response.data.error as { message?: string };
    return typedError.message ?? 'Unexpected server error';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unexpected error';
};

export const reportSchedulesService = {
  async getAll(params?: {
    reportType?: string;
    templateId?: string;
    isActive?: boolean;
  }): Promise<ReportSchedule[]> {
    const response = await api.get<{ data: ReportSchedule[] }>(
      '/report-schedules',
      { params }
    );
    return response.data.data;
  },

  async getById(id: string): Promise<ReportSchedule> {
    const response = await api.get<{ data: ReportSchedule }>(
      `/report-schedules/${id}`
    );
    return response.data.data;
  },

  async create(
    payload: CreateReportScheduleRequest
  ): Promise<ReportSchedule> {
    try {
      const response = await api.post<{ data: ReportSchedule }>(
        '/report-schedules',
        payload
      );
      return response.data.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  },

  async update(
    id: string,
    payload: UpdateReportScheduleRequest
  ): Promise<ReportSchedule> {
    const response = await api.put<{ data: ReportSchedule }>(
      `/report-schedules/${id}`,
      payload
    );
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/report-schedules/${id}`);
  },

  async toggleStatus(id: string, isActive: boolean): Promise<ReportSchedule> {
    const response = await api.patch<{ data: ReportSchedule }>(
      `/report-schedules/${id}/status`,
      { isActive }
    );
    return response.data.data;
  },

  async runNow(id: string): Promise<{ executionId: string }> {
    const response = await api.post<{ data: { executionId: string } }>(
      `/report-schedules/${id}/run-now`
    );
    return response.data.data;
  },

  async getExecutions(scheduleId: string): Promise<ReportExecution[]> {
    const response = await api.get<{ data: ReportExecution[] }>(
      `/report-schedules/${scheduleId}/executions`
    );
    return response.data.data;
  },
};


