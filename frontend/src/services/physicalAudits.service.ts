import api from '@/lib/api';

export type PhysicalAuditStatus =
  | 'draft'
  | 'scheduled'
  | 'counting'
  | 'review'
  | 'completed'
  | 'cancelled';

export type PhysicalAuditType = 'cycle' | 'blind' | 'full';

type EntityRef =
  | string
  | {
      _id: string;
      name?: string;
      code?: string;
      storeCode?: string;
      firstName?: string;
      lastName?: string;
    };

export interface PhysicalAuditEntry {
  product: EntityRef;
  sku?: string;
  name?: string;
  category?: string;
  expectedQty: number;
  countedQty?: number;
  variance?: number;
  status: 'pending' | 'counted' | 'needs_review';
  notes?: string;
  lastCountedBy?: EntityRef;
  lastCountedAt?: string;
}

export interface PhysicalAuditSession {
  _id: string;
  name: string;
  reference: string;
  status: PhysicalAuditStatus;
  type: PhysicalAuditType;
  store: EntityRef;
  scheduledFor?: string;
  dueDate?: string;
  instructions?: string;
  entries: PhysicalAuditEntry[];
  counters?: Array<{
    user: EntityRef;
    role?: string;
    status: 'pending' | 'active' | 'complete';
  }>;
  timeline: {
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    cancelledAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PhysicalAuditListResponse {
  records: PhysicalAuditSession[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreatePhysicalAuditRequest {
  name: string;
  type: PhysicalAuditType;
  storeId: string;
  scheduledFor?: string;
  dueDate?: string;
  instructions?: string;
  counters?: Array<{ userId: string; role?: string }>;
  entries: Array<{
    productId: string;
    sku?: string;
    name?: string;
    category?: string;
    expectedQty: number;
  }>;
}

export type UpdatePhysicalAuditRequest = Partial<CreatePhysicalAuditRequest>;

const baseUrl = '/physical-audits';

export const physicalAuditsService = {
  async list(params?: {
    status?: PhysicalAuditStatus;
    type?: PhysicalAuditType;
    storeId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PhysicalAuditListResponse> {
    const response = await api.get<{ data: PhysicalAuditListResponse }>(baseUrl, { params });
    return response.data.data;
  },

  async getById(id: string): Promise<PhysicalAuditSession> {
    const response = await api.get<{ data: PhysicalAuditSession }>(`${baseUrl}/${id}`);
    return response.data.data;
  },

  async create(payload: CreatePhysicalAuditRequest): Promise<PhysicalAuditSession> {
    const response = await api.post<{ data: PhysicalAuditSession }>(baseUrl, payload);
    return response.data.data;
  },

  async update(id: string, payload: UpdatePhysicalAuditRequest): Promise<PhysicalAuditSession> {
    const response = await api.put<{ data: PhysicalAuditSession }>(`${baseUrl}/${id}`, payload);
    return response.data.data;
  },

  async start(id: string): Promise<PhysicalAuditSession> {
    const response = await api.post<{ data: PhysicalAuditSession }>(`${baseUrl}/${id}/start`);
    return response.data.data;
  },

  async recordCounts(
    id: string,
    entries: Array<{ productId: string; countedQty: number; notes?: string }>
  ): Promise<PhysicalAuditSession> {
    const response = await api.post<{ data: PhysicalAuditSession }>(`${baseUrl}/${id}/counts`, {
      entries,
    });
    return response.data.data;
  },

  async moveToReview(id: string): Promise<PhysicalAuditSession> {
    const response = await api.post<{ data: PhysicalAuditSession }>(`${baseUrl}/${id}/review`);
    return response.data.data;
  },

  async complete(id: string): Promise<PhysicalAuditSession> {
    const response = await api.post<{ data: PhysicalAuditSession }>(`${baseUrl}/${id}/complete`);
    return response.data.data;
  },

  async cancel(id: string, reason?: string): Promise<PhysicalAuditSession> {
    const response = await api.post<{ data: PhysicalAuditSession }>(`${baseUrl}/${id}/cancel`, {
      reason,
    });
    return response.data.data;
  },
};

