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
  async getPermissionsByModule(module: string): Promise<{ permissions: Permission[] }> {
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
}

export const rolesService = new RolesService();

