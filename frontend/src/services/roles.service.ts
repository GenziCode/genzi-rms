import { api } from '@/lib/api';

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  category: 'system' | 'custom';
  permissions: string[];
  scope: {
    type: 'all' | 'store' | 'department' | 'custom';
    storeIds?: string[];
    departmentIds?: string[];
  };
  isSystemRole: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleRequest {
  name: string;
  code: string;
  description?: string;
  category?: 'system' | 'custom';
  permissionCodes?: string[];
  scope?: {
    type: 'all' | 'store' | 'department' | 'custom';
    storeIds?: string[];
    departmentIds?: string[];
  };
}

export interface UpdateRoleRequest extends Partial<CreateRoleRequest> {
  isActive?: boolean;
}

export interface Permission {
  code: string;
  name: string;
  module: string;
  action: string;
  description?: string;
  category: 'crud' | 'action' | 'report' | 'admin';
  isSystem?: boolean;
}

class RolesService {
  /**
   * Get all roles
   */
  async getAll(): Promise<{ roles: Role[] }> {
    const response = await api.get('/roles');
    return response.data.data;
  }

  /**
   * Get role by ID
   */
  async getById(id: string): Promise<{ role: Role }> {
    const response = await api.get(`/roles/${id}`);
    return response.data.data;
  }

  /**
   * Create role
   */
  async create(data: CreateRoleRequest): Promise<{ role: Role }> {
    const response = await api.post('/roles', data);
    return response.data.data;
  }

  /**
   * Update role
   */
  async update(id: string, data: UpdateRoleRequest): Promise<{ role: Role }> {
    const response = await api.put(`/roles/${id}`, data);
    return response.data.data;
  }

  /**
   * Delete role
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/roles/${id}`);
  }

  /**
   * Get all permissions
   */
  async getPermissions(): Promise<{ permissions: Permission[] }> {
    const response = await api.get('/permissions');
    return response.data.data;
  }

  /**
   * Get permissions by module
   */
  async getPermissionsByModule(
    module: string
  ): Promise<{ permissions: Permission[] }> {
    const response = await api.get(`/permissions/module/${module}`);
    return response.data.data;
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(
    userId: string,
    roleId: string,
    expiresAt?: Date,
    scopeOverride?: any
  ): Promise<void> {
    await api.post(`/users/${userId}/roles`, {
      roleId,
      expiresAt,
      scopeOverride,
    });
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await api.delete(`/users/${userId}/roles/${roleId}`);
  }

  /**
   * Get user roles
   */
  async getUserRoles(userId: string): Promise<{ roles: Role[] }> {
    const response = await api.get(`/users/${userId}/roles`);
    return response.data.data;
  }

  /**
   * Get role analytics
   */
  async getAnalytics(): Promise<{
    totalRoles: number;
    activeRoles: number;
    systemRoles: number;
    customRoles: number;
  }> {
    const response = await api.get('/roles/analytics');
    return response.data.data;
  }

  /**
   * Get role distribution by category
   */
  async getDistribution(): Promise<{ distribution: Record<string, number> }> {
    const response = await api.get('/roles/distribution');
    return response.data.data;
  }

  /**
   * Get built-in system roles
   */
  async getBuiltInRoles(): Promise<{ roles: Role[] }> {
    const response = await api.get('/roles/built-in');
    return response.data.data;
  }

  /**
   * Initialize default roles for tenant
   */
  async initializeDefaultRoles(): Promise<void> {
    await api.post('/roles/initialize');
  }
}

export const rolesService = new RolesService();
