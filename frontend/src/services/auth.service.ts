import api from '@/lib/api';
import type {
  LoginResponse,
  RegisterResponse,
  RegisterTenantRequest,
  User,
} from '@/types';

export const authService = {
  // Login
  async login(email: string, password: string) {
    const response = await api.post<{ data: LoginResponse }>('/auth/login', {
      email,
      password,
    });
    return response.data.data;
  },

  // Register Tenant
  async registerTenant(data: RegisterTenantRequest) {
    const response = await api.post<{ data: RegisterResponse }>(
      '/tenants/register',
      data
    );
    return response.data.data;
  },

  // Get current user
  async me() {
    const response = await api.get<{ data: { user: User } }>('/auth/me');
    return response.data.data.user;
  },

  // Logout
  async logout() {
    await api.post('/auth/logout');
  },

  // Change password
  async changePassword(currentPassword: string, newPassword: string) {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // Refresh token
  async refreshToken(refreshToken: string) {
    const response = await api.post<{
      data: { accessToken: string; refreshToken: string };
    }>(
      '/auth/refresh',
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    );
    return response.data.data;
  },
};

