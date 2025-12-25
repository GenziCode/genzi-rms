import api from '@/lib/api';

export interface Store {
    _id: string;
    name: string;
    code: string;
    email?: string;
    phone?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
    };
    settings?: {
        timezone?: string;
        currency?: string;
        taxRate?: number;
    };
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateStoreRequest {
    name: string;
    code: string;
    email?: string;
    phone?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
    };
    settings?: {
        timezone?: string;
        currency?: string;
        taxRate?: number;
    };
}

export type UpdateStoreRequest = Partial<CreateStoreRequest>;

export const storesService = {
    /**
     * Get all stores
     * GET /api/stores
     */
    async getAll() {
        const response = await api.get<{ data: { stores: Store[] } }>('/stores');
        return response.data.data.stores;
    },

    /**
     * Get store by ID
     * GET /api/stores/:id
     */
    async getById(id: string) {
        const response = await api.get<{ data: Store }>(`/stores/${id}`);
        return response.data.data;
    },

    /**
     * Create store
     * POST /api/stores
     */
    async create(data: CreateStoreRequest) {
        const response = await api.post<{ data: Store }>('/stores', data);
        return response.data.data;
    },

    /**
     * Update store
     * PUT /api/stores/:id
     */
    async update(id: string, data: UpdateStoreRequest) {
        const response = await api.put<{ data: Store }>(`/stores/${id}`, data);
        return response.data.data;
    },

    /**
     * Delete store
     * DELETE /api/stores/:id
     */
    async delete(id: string) {
        const response = await api.delete(`/stores/${id}`);
        return response.data.data;
    },
};
