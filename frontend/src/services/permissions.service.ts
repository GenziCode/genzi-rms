import { api } from '@/lib/api';

export interface Permission {
  code: string;
  name: string;
  module: string;
  action: string;
  description?: string;
  category: 'crud' | 'action' | 'report' | 'admin';
  isSystem?: boolean;
}

export interface FormPermission {
  formName: string;
  formCaption: string;
  formCategory: string;
  module?: string;
  route?: string;
  httpMethods?: string[];
}

export interface FieldPermission {
  formName: string;
  controlName: string;
  controlType: string;
  fieldPath?: string;
  label: string;
  isVisible: boolean;
  isEditable: boolean;
  isRequired: boolean;
}

class PermissionsService {
  /**
   * Get all permissions
   */
  async getAll(): Promise<{ permissions: Permission[] }> {
    const response = await api.get('/permissions');
    return response.data.data;
  }

  /**
   * Get permissions by module
   */
  async getByModule(module: string): Promise<{ permissions: Permission[] }> {
    const response = await api.get(`/permissions/module/${module}`);
    return response.data.data;
  }

  /**
   * Get permissions grouped by module
   */
  async getGroupedByModule(): Promise<Record<string, Permission[]>> {
    const response = await api.get('/permissions/grouped');
    return response.data.data.permissions || {};
  }

  /**
   * Get all forms
   */
  async getForms(): Promise<{ forms: FormPermission[] }> {
    const response = await api.get('/form-permissions');
    return response.data.data;
  }

  /**
   * Get forms by category
   */
  async getFormsByCategory(): Promise<Record<string, FormPermission[]>> {
    const response = await api.get('/form-permissions/categories');
    return response.data.data;
  }

  /**
   * Check form access
   */
  async checkFormAccess(formName: string): Promise<{ hasAccess: boolean }> {
    const response = await api.get(`/form-permissions/check/${formName}`);
    return response.data.data;
  }

  /**
   * Get fields for form
   */
  async getFieldsForForm(
    formName: string
  ): Promise<{ fields: FieldPermission[] }> {
    const response = await api.get(`/field-permissions/forms/${formName}`);
    return response.data.data;
  }

  /**
   * Get user fields for form
   */
  async getUserFieldsForForm(
    formName: string
  ): Promise<{ fields: FieldPermission[] }> {
    const response = await api.get(`/field-permissions/forms/${formName}/user`);
    return response.data.data;
  }
}

export const permissionsService = new PermissionsService();
