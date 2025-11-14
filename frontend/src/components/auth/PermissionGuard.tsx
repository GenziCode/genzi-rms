import { ReactNode } from 'react';
import { useHasPermission, useHasAnyPermission, useHasAllPermissions } from '@/hooks/usePermissions';
import { Shield, Lock } from 'lucide-react';

interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  showError?: boolean;
  children: ReactNode;
}

/**
 * Permission Guard Component
 * Conditionally renders children based on user permissions
 */
export default function PermissionGuard({
  permission,
  permissions,
  requireAll = false,
  fallback,
  showError = false,
  children,
}: PermissionGuardProps) {
  const hasSinglePermission = permission ? useHasPermission(permission) : true;
  const hasAnyPermission = permissions && !requireAll ? useHasAnyPermission(permissions) : true;
  const hasAllPermissions = permissions && requireAll ? useHasAllPermissions(permissions) : true;

  const hasAccess =
    hasSinglePermission && (permissions ? (requireAll ? hasAllPermissions : hasAnyPermission) : true);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
        <Lock className="w-12 h-12 text-yellow-600 mb-4" />
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">Access Denied</h3>
        <p className="text-sm text-yellow-700 text-center">
          You don't have permission to access this content.
          {permission && (
            <span className="block mt-1">
              Required permission: <code className="bg-yellow-100 px-2 py-1 rounded">{permission}</code>
            </span>
          )}
        </p>
      </div>
    );
  }

  return null;
}

/**
 * Module Guard Component
 * Conditionally renders children based on module access
 */
interface ModuleGuardProps {
  module: string;
  action?: string;
  fallback?: ReactNode;
  showError?: boolean;
  children: ReactNode;
}

export function ModuleGuard({
  module,
  action,
  fallback,
  showError = false,
  children,
}: ModuleGuardProps) {
  const permission = action ? `${module}:${action}` : `${module}:read`;
  const hasPermission = useHasPermission(permission);

  if (hasPermission) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
        <Shield className="w-12 h-12 text-yellow-600 mb-4" />
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">Module Access Denied</h3>
        <p className="text-sm text-yellow-700 text-center">
          You don't have access to the <strong>{module}</strong> module.
          {action && (
            <span className="block mt-1">
              Required action: <code className="bg-yellow-100 px-2 py-1 rounded">{action}</code>
            </span>
          )}
        </p>
      </div>
    );
  }

  return null;
}

