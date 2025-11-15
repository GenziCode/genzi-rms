import api from '@/lib/api';

export interface Warehouse {
  _id: string;
  store: string;
  name: string;
  code: string;
  description?: string;
  zones: Array<{
    name: string;
    code: string;
    type: 'receiving' | 'storage' | 'picking' | 'staging';
    description?: string;
  }>;
  bins: Array<{
    code: string;
    zoneCode: string;
    capacity?: number;
    currentLoad?: number;
    allowOversize?: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseListResponse {
  records: Warehouse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateWarehouseRequest {
  storeId: string;
  name: string;
  code: string;
  description?: string;
  zones?: Warehouse['zones'];
  bins?: Warehouse['bins'];
}

export type UpdateWarehouseRequest = Partial<CreateWarehouseRequest>;

export const warehouseService = {
  async list(params?: {
    storeId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<WarehouseListResponse> {
    const response = await api.get<{ data: WarehouseListResponse }>('/warehouses', {
      params,
    });
    return response.data.data;
  },

  async create(payload: CreateWarehouseRequest): Promise<Warehouse> {
    const response = await api.post<{ data: Warehouse }>('/warehouses', payload);
    return response.data.data;
  },

  async update(id: string, payload: UpdateWarehouseRequest): Promise<Warehouse> {
    const response = await api.put<{ data: Warehouse }>(`/warehouses/${id}`, payload);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/warehouses/${id}`);
  },
};

