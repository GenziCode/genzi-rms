import api from '@/lib/api';
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerFilters,
  CustomerListResponse,
  CustomerStats,
  CustomerPurchaseHistory,
} from '@/types/customer.types';

export const customersService = {
  /**
   * Get all customers with filters
   * GET /api/customers
   */
  async getAll(filters?: CustomerFilters): Promise<CustomerListResponse> {
    const response = await api.get<{
      success: boolean;
      data: {
        customers: Customer[];
        total: number;
        page: number;
        totalPages: number;
      };
      message: string;
      meta: {
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };
    }>('/customers', { params: filters });
    
    return {
      customers: response.data.data.customers,
      pagination: response.data.meta?.pagination || {
        page: response.data.data.page,
        limit: filters?.limit || 20,
        total: response.data.data.total,
        totalPages: response.data.data.totalPages,
      },
    };
  },

  /**
   * Get customer by ID
   * GET /api/customers/:id
   */
  async getById(id: string): Promise<Customer> {
    const response = await api.get<{ data: Customer }>(`/customers/${id}`);
    return response.data.data;
  },

  /**
   * Create new customer
   * POST /api/customers
   */
  async create(data: CreateCustomerRequest): Promise<Customer> {
    const response = await api.post<{ data: Customer }>('/customers', data);
    return response.data.data;
  },

  /**
   * Update customer
   * PUT /api/customers/:id
   */
  async update(id: string, data: UpdateCustomerRequest): Promise<Customer> {
    const response = await api.put<{ data: Customer }>(`/customers/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete customer
   * DELETE /api/customers/:id
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/customers/${id}`);
  },

  /**
   * Get customer statistics
   * GET /api/customers/stats
   */
  async getStats(): Promise<CustomerStats> {
    const response = await api.get<{ data: CustomerStats }>('/customers/stats');
    return response.data.data;
  },

  /**
   * Get customer purchase history
   * GET /api/customers/:id/history
   */
  async getPurchaseHistory(id: string): Promise<CustomerPurchaseHistory[]> {
    const response = await api.get<{ data: CustomerPurchaseHistory[] }>(
      `/customers/${id}/history`
    );
    return response.data.data;
  },

  /**
   * Add loyalty points
   * POST /api/customers/:id/loyalty/add
   */
  async addLoyaltyPoints(id: string, points: number, reason?: string): Promise<Customer> {
    const response = await api.post<{ data: Customer }>(
      `/customers/${id}/loyalty/add`,
      { points, reason }
    );
    return response.data.data;
  },

  /**
   * Redeem loyalty points
   * POST /api/customers/:id/loyalty/redeem
   */
  async redeemLoyaltyPoints(id: string, points: number): Promise<Customer> {
    const response = await api.post<{ data: Customer }>(
      `/customers/${id}/loyalty/redeem`,
      { points }
    );
    return response.data.data;
  },

  /**
   * Add credit
   * POST /api/customers/:id/credit/add
   */
  async addCredit(id: string, amount: number, notes?: string): Promise<Customer> {
    const response = await api.post<{ data: Customer }>(
      `/customers/${id}/credit/add`,
      { amount, notes }
    );
    return response.data.data;
  },

  /**
   * Deduct credit
   * POST /api/customers/:id/credit/deduct
   */
  async deductCredit(id: string, amount: number, notes?: string): Promise<Customer> {
    const response = await api.post<{ data: Customer }>(
      `/customers/${id}/credit/deduct`,
      { amount, notes }
    );
    return response.data.data;
  },
};
