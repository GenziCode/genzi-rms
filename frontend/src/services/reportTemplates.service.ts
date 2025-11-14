import api from '@/lib/api';

export interface ReportTemplate {
  _id: string;
  name: string;
  description?: string;
  category: 'sales' | 'inventory' | 'financial' | 'customer' | 'operational' | 'custom';
  module: string;
  query: {
    collection: string;
    baseMatch?: any;
    pipeline?: any[];
  };
  columns: Array<{
    field: string;
    label: string;
    type: 'string' | 'number' | 'date' | 'currency' | 'percentage' | 'boolean';
    format?: string;
    aggregate?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'first' | 'last';
    visible: boolean;
    order: number;
  }>;
  filters: Array<{
    field: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'dateRange' | 'select' | 'multiselect' | 'boolean';
    options?: Array<{ value: string; label: string }>;
    defaultValue?: any;
    required: boolean;
  }>;
  grouping?: {
    enabled: boolean;
    fields: Array<{
      field: string;
      label: string;
      order: number;
    }>;
  };
  sorting?: {
    defaultField: string;
    defaultOrder: 'asc' | 'desc';
    allowedFields: string[];
  };
  format: {
    showHeader: boolean;
    showFooter: boolean;
    showTotals: boolean;
    pageSize?: number;
    orientation?: 'portrait' | 'landscape';
  };
  isSystemTemplate: boolean;
  isActive: boolean;
  version: number;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportTemplateVersion {
  _id: string;
  templateId: string;
  version: number;
  name: string;
  description?: string;
  category: string;
  module: string;
  query: any;
  columns: any[];
  filters: any[];
  grouping?: any;
  sorting?: any;
  format: any;
  changeDescription?: string;
  changedBy: {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  changedAt: string;
  isCurrentVersion: boolean;
}

export interface CreateReportTemplateRequest {
  name: string;
  description?: string;
  category: 'sales' | 'inventory' | 'financial' | 'customer' | 'operational' | 'custom';
  module: string;
  query: {
    collection: string;
    baseMatch?: any;
    pipeline?: any[];
  };
  columns: Array<{
    field: string;
    label: string;
    type: 'string' | 'number' | 'date' | 'currency' | 'percentage' | 'boolean';
    format?: string;
    aggregate?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'first' | 'last';
    visible: boolean;
    order: number;
  }>;
  filters?: Array<{
    field: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'dateRange' | 'select' | 'multiselect' | 'boolean';
    options?: Array<{ value: string; label: string }>;
    defaultValue?: any;
    required: boolean;
  }>;
  grouping?: {
    enabled: boolean;
    fields: Array<{
      field: string;
      label: string;
      order: number;
    }>;
  };
  sorting?: {
    defaultField: string;
    defaultOrder: 'asc' | 'desc';
    allowedFields: string[];
  };
  format?: {
    showHeader: boolean;
    showFooter: boolean;
    showTotals: boolean;
    pageSize?: number;
    orientation?: 'portrait' | 'landscape';
  };
  isSystemTemplate?: boolean;
}

export interface UpdateReportTemplateRequest extends Partial<CreateReportTemplateRequest> {
  changeDescription?: string;
}

export const reportTemplatesService = {
  /**
   * Get all report templates
   * GET /api/report-templates
   */
  async getAll(filters?: {
    category?: string;
    module?: string;
    isActive?: boolean;
    isSystemTemplate?: boolean;
  }): Promise<ReportTemplate[]> {
    const response = await api.get<{ data: ReportTemplate[] }>('/report-templates', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Get template by ID
   * GET /api/report-templates/:id
   */
  async getById(id: string): Promise<ReportTemplate> {
    const response = await api.get<{ data: ReportTemplate }>(`/report-templates/${id}`);
    return response.data.data;
  },

  /**
   * Create new template
   * POST /api/report-templates
   */
  async create(data: CreateReportTemplateRequest): Promise<ReportTemplate> {
    const response = await api.post<{ data: ReportTemplate }>('/report-templates', data);
    return response.data.data;
  },

  /**
   * Update template
   * PUT /api/report-templates/:id
   */
  async update(id: string, data: UpdateReportTemplateRequest): Promise<ReportTemplate> {
    const response = await api.put<{ data: ReportTemplate }>(`/report-templates/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete template
   * DELETE /api/report-templates/:id
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/report-templates/${id}`);
  },

  /**
   * Clone template
   * POST /api/report-templates/:id/clone
   */
  async clone(id: string, name: string): Promise<ReportTemplate> {
    const response = await api.post<{ data: ReportTemplate }>(`/report-templates/${id}/clone`, {
      name,
    });
    return response.data.data;
  },

  /**
   * Get template versions
   * GET /api/report-templates/:id/versions
   */
  async getVersions(id: string): Promise<ReportTemplateVersion[]> {
    const response = await api.get<{ data: ReportTemplateVersion[] }>(
      `/report-templates/${id}/versions`
    );
    return response.data.data;
  },

  /**
   * Get specific template version
   * GET /api/report-templates/:id/versions/:version
   */
  async getVersion(id: string, version: number): Promise<ReportTemplateVersion> {
    const response = await api.get<{ data: ReportTemplateVersion }>(
      `/report-templates/${id}/versions/${version}`
    );
    return response.data.data;
  },

  /**
   * Rollback template to version
   * POST /api/report-templates/:id/rollback
   */
  async rollback(id: string, version: number): Promise<ReportTemplate> {
    const response = await api.post<{ data: ReportTemplate }>(`/report-templates/${id}/rollback`, {
      version,
    });
    return response.data.data;
  },

  /**
   * Compare two versions
   * GET /api/report-templates/:id/compare/:version1/:version2
   */
  async compare(id: string, version1: number, version2: number) {
    const response = await api.get(`/report-templates/${id}/compare/${version1}/${version2}`);
    return response.data.data;
  },
};

