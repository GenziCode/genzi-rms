import api from '@/lib/api';
import type {
  Vendor,
  CreateVendorRequest,
  UpdateVendorRequest,
  VendorFilters,
  VendorListResponse,
  VendorStats,
} from '@/types/vendor.types';

export const vendorsService = {
  /**
   * Get all vendors with filters
   * GET /api/vendors
   */
  async getAll(filters?: VendorFilters): Promise<VendorListResponse> {
    const response = await api.get<{
      success: boolean;
      data: {
        vendors: Vendor[];
        total: number;
        page: number;
        totalPages: number;
      };
      message: string;
      meta?: {
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };
    }>('/vendors', { params: filters });

    return {
      vendors: response.data.data.vendors,
      pagination: response.data.meta?.pagination || {
        page: response.data.data.page,
        limit: filters?.limit || 20,
        total: response.data.data.total,
        totalPages: response.data.data.totalPages,
      },
    };
  },

  /**
   * Get vendor by ID
   * GET /api/vendors/:id
   */
  async getById(id: string): Promise<Vendor> {
    const response = await api.get<{ data: Vendor }>(`/vendors/${id}`);
    return response.data.data;
  },

  /**
   * Create new vendor
   * POST /api/vendors
   */
  async create(data: CreateVendorRequest): Promise<Vendor> {
    const response = await api.post<{ data: Vendor }>('/vendors', data);
    return response.data.data;
  },

  /**
   * Update vendor
   * PUT /api/vendors/:id
   */
  async update(id: string, data: UpdateVendorRequest): Promise<Vendor> {
    const response = await api.put<{ data: Vendor }>(`/vendors/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete vendor
   * DELETE /api/vendors/:id
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/vendors/${id}`);
  },

  /**
   * Get vendor statistics
   * GET /api/vendors/:id/stats
   */
  async getStats(id: string): Promise<VendorStats> {
    const response = await api.get<{ data: VendorStats }>(`/vendors/${id}/stats`);
    return response.data.data;
  },
};

