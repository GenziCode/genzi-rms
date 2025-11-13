import api from '@/lib/api';
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserRoleRequest,
  ResetPasswordRequest,
  UserListResponse,
} from '@/types/user.types';

export const usersService = {
  /**
   * Get all users
   * GET /api/users
   */
  async getAll(params?: any): Promise<UserListResponse> {
    const response = await api.get<{
      data: {
        users: User[];
        total: number;
        page: number;
        totalPages: number;
      };
    }>('/users', { params });
    
    return {
      users: response.data.data.users,
      pagination: {
        page: response.data.data.page,
        limit: params?.limit || 20,
        total: response.data.data.total,
        totalPages: response.data.data.totalPages,
      },
    };
  },

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  async getById(id: string): Promise<User> {
    const response = await api.get<{ data: User }>(`/users/${id}`);
    return response.data.data;
  },

  /**
   * Create user
   * POST /api/users
   */
  async create(data: CreateUserRequest): Promise<User> {
    const response = await api.post<{ data: User }>('/users', data);
    return response.data.data;
  },

  /**
   * Update user
   * PUT /api/users/:id
   */
  async update(id: string, data: UpdateUserRequest): Promise<User> {
    const response = await api.put<{ data: User }>(`/users/${id}`, data);
    return response.data.data;
  },

  /**
   * Update user role
   * PUT /api/users/:id/role
   */
  async updateRole(id: string, data: UpdateUserRoleRequest): Promise<User> {
    const response = await api.put<{ data: User }>(`/users/${id}/role`, data);
    return response.data.data;
  },

  /**
   * Delete user
   * DELETE /api/users/:id
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  /**
   * Reset user password
   * POST /api/users/:id/reset-password
   */
  async resetPassword(id: string, data: ResetPasswordRequest): Promise<User> {
    const response = await api.post<{ data: User }>(`/users/${id}/reset-password`, data);
    return response.data.data;
  },
};

