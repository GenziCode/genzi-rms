import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

/**
 * Permission Hook
 * Provides permission checking utilities
 */

interface PermissionData {
  permissions: string[];
  roles: Array<{
    id: string;
    name: string;
    code: string;
  }>;
}

/**
 * Get user permissions and roles
 */
export function usePermissions() {
  const user = useAuthStore((state) => state.user);

  // For now, use permissions from auth store (legacy system)
  // TODO: Migrate to RBAC roles system
  return {
    permissions: user?.permissions || [],
    roles: [], // TODO: Implement roles fetching
    isLoading: false,
    error: null,
  };
}

/**
 * Check if user has a specific permission
 */
export function useHasPermission(permission: string) {
  const { permissions } = usePermissions();

  return permissions.includes(permission) || permissions.includes('*');
}

/**
 * Check if user has any of the required permissions
 */
export function useHasAnyPermission(permissions: string[]) {
  const { permissions: userPermissions } = usePermissions();

  if (userPermissions.includes('*')) {
    return true;
  }

  return permissions.some(perm => userPermissions.includes(perm));
}

/**
 * Check if user has all required permissions
 */
export function useHasAllPermissions(permissions: string[]) {
  const { permissions: userPermissions } = usePermissions();

  if (userPermissions.includes('*')) {
    return true;
  }

  return permissions.every(perm => userPermissions.includes(perm));
}

/**
 * Check if user can access a form
 */
export function useCanAccessForm(formName: string) {
  const user = useAuthStore((state) => state.user);

  const { data, isLoading } = useQuery<{ hasAccess: boolean }>({
    queryKey: ['form-access', formName, user?._id],
    queryFn: async () => {
      const response = await api.get(`/form-permissions/check/${formName}`);
      return response.data.data;
    },
    enabled: !!user?._id && !!formName,
    staleTime: 5 * 60 * 1000,
  });

  return {
    canAccess: data?.hasAccess ?? false,
    isLoading,
  };
}

/**
 * Check bulk form access
 */
export function useCanAccessForms(formNames: string[]) {
  const user = useAuthStore((state) => state.user);

  const { data, isLoading } = useQuery<{ access: Record<string, boolean> }>({
    queryKey: ['form-access-bulk', formNames.join(','), user?._id],
    queryFn: async () => {
      const response = await api.get(
        `/form-permissions/check-bulk?formNames=${formNames.join(',')}`
      );
      return response.data.data;
    },
    enabled: !!user?._id && formNames.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return {
    access: data?.access || {},
    isLoading,
  };
}

/**
 * Check if user can edit a field
 */
export function useCanEditField(formName: string, controlName: string) {
  const user = useAuthStore((state) => state.user);

  const { data, isLoading } = useQuery<{ canEdit: boolean }>({
    queryKey: ['field-access', formName, controlName, user?._id],
    queryFn: async () => {
      const response = await api.get(
        `/field-permissions/check/${formName}/${controlName}`
      );
      return response.data.data;
    },
    enabled: !!user?._id && !!formName && !!controlName,
    staleTime: 5 * 60 * 1000,
  });

  return {
    canEdit: data?.canEdit ?? false,
    isLoading,
  };
}

