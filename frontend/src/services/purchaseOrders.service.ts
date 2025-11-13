import api from '@/lib/api';
import type {
  PurchaseOrder,
  CreatePurchaseOrderRequest,
  UpdatePurchaseOrderRequest,
  ReceivePurchaseOrderRequest,
  PurchaseOrderFilters,
  PurchaseOrderListResponse,
  PurchaseOrderStats,
} from '@/types/purchaseOrder.types';

export const purchaseOrdersService = {
  /**
   * Get all purchase orders with filters
   * GET /api/purchase-orders
   */
  async getAll(filters?: PurchaseOrderFilters): Promise<PurchaseOrderListResponse> {
    // Clean filters to avoid validation errors
    const cleanFilters: any = {};
    if (filters?.page) cleanFilters.page = filters.page;
    if (filters?.limit) cleanFilters.limit = filters.limit;
    if (filters?.status) cleanFilters.status = filters.status;
    if (filters?.vendorId) cleanFilters.vendorId = filters.vendorId;
    if (filters?.search) cleanFilters.search = filters.search;
    
    const response = await api.get<{
      success: boolean;
      data: {
        purchaseOrders: PurchaseOrder[];
        total: number;
        page: number;
        totalPages: number;
      };
    }>('/purchase-orders', { params: cleanFilters });
    
    return {
      purchaseOrders: response.data.data.purchaseOrders,
      pagination: {
        page: response.data.data.page,
        limit: filters?.limit || 20,
        total: response.data.data.total,
        totalPages: response.data.data.totalPages,
      },
    };
  },

  /**
   * Get purchase order by ID
   * GET /api/purchase-orders/:id
   */
  async getById(id: string): Promise<PurchaseOrder> {
    const response = await api.get<{ data: PurchaseOrder }>(`/purchase-orders/${id}`);
    return response.data.data;
  },

  /**
   * Create new purchase order
   * POST /api/purchase-orders
   */
  async create(data: CreatePurchaseOrderRequest): Promise<PurchaseOrder> {
    const response = await api.post<{ data: PurchaseOrder }>('/purchase-orders', data);
    return response.data.data;
  },

  /**
   * Update purchase order
   * PUT /api/purchase-orders/:id
   */
  async update(id: string, data: UpdatePurchaseOrderRequest): Promise<PurchaseOrder> {
    const response = await api.put<{ data: PurchaseOrder }>(`/purchase-orders/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete purchase order
   * DELETE /api/purchase-orders/:id
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/purchase-orders/${id}`);
  },

  /**
   * Approve purchase order
   * POST /api/purchase-orders/:id/approve
   */
  async approve(id: string): Promise<PurchaseOrder> {
    const response = await api.post<{ data: PurchaseOrder }>(`/purchase-orders/${id}/approve`);
    return response.data.data;
  },

  /**
   * Receive purchase order (GRN)
   * POST /api/purchase-orders/:id/receive
   */
  async receive(id: string, data: ReceivePurchaseOrderRequest): Promise<PurchaseOrder> {
    const response = await api.post<{ data: PurchaseOrder }>(`/purchase-orders/${id}/receive`, data);
    return response.data.data;
  },

  /**
   * Cancel purchase order
   * POST /api/purchase-orders/:id/cancel
   */
  async cancel(id: string, reason: string): Promise<PurchaseOrder> {
    const response = await api.post<{ data: PurchaseOrder }>(`/purchase-orders/${id}/cancel`, { reason });
    return response.data.data;
  },

  /**
   * Get purchase order statistics
   * GET /api/purchase-orders/stats
   */
  async getStats(): Promise<PurchaseOrderStats> {
    const response = await api.get<{ data: PurchaseOrderStats }>('/purchase-orders/stats');
    return response.data.data;
  },
};

