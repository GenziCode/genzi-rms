import { useMemo } from 'react';
import { Check, X, Shield, Crown } from 'lucide-react';
import type { Role } from '@/services/roles.service';
import type { Permission } from '@/services/permissions.service';

interface PermissionMatrixProps {
  permissions: Record<string, Permission[]>;
  roles: Role[];
}

export default function PermissionMatrix({ permissions, roles }: PermissionMatrixProps) {
  const allPermissions = useMemo(() => {
    return Object.values(permissions).flat();
  }, [permissions]);

  const hasPermission = (role: Role, permissionCode: string) => {
    return role.permissions?.includes(permissionCode) || role.permissions?.includes('*') || false;
  };

  const getRoleIcon = (role: Role) => {
    if (role.isSystemRole) return Crown;
    return Shield;
  };

  if (roles.length === 0 || allPermissions.length === 0) {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No data available</h3>
        <p className="text-gray-600">Roles and permissions data is loading...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-full inline-block align-middle">
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                  Permission / Role
                </th>
                {roles.map((role) => {
                  const Icon = getRoleIcon(role);
                  return (
                    <th
                      key={role.id}
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Icon className={`w-5 h-5 ${role.isSystemRole ? 'text-yellow-600' : 'text-blue-600'}`} />
                        <div className="text-center">
                          <div className="font-semibold text-gray-900 text-sm">{role.name}</div>
                          <div className="text-xs text-gray-500">{role.code}</div>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Group permissions by module */}
              {Object.entries(permissions).map(([module, modulePermissions]) => (
                <>
                  {/* Module header row */}
                  <tr key={`${module}-header`} className="bg-gray-100">
                    <td
                      colSpan={roles.length + 1}
                      className="px-6 py-3 text-sm font-semibold text-gray-900 capitalize sticky left-0 bg-gray-100"
                    >
                      {module} Module ({modulePermissions.length} permissions)
                    </td>
                  </tr>

                  {/* Permission rows */}
                  {modulePermissions.map((permission) => (
                    <tr key={permission.code} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {permission.name}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                {permission.code}
                              </code>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                permission.category === 'admin'
                                  ? 'bg-purple-100 text-purple-800'
                                  : permission.category === 'report'
                                  ? 'bg-green-100 text-green-800'
                                  : permission.category === 'action'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {permission.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {roles.map((role) => {
                        const hasPerm = hasPermission(role, permission.code);
                        return (
                          <td key={`${role.id}-${permission.code}`} className="px-6 py-4 text-center">
                            <div className="flex justify-center">
                              {hasPerm ? (
                                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                                  <Check className="w-4 h-4 text-green-600" />
                                </div>
                              ) : (
                                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                                  <X className="w-4 h-4 text-gray-400" />
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-lg font-semibold text-blue-900">{roles.length}</div>
              <div className="text-sm text-blue-700">Total Roles</div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Check className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-lg font-semibold text-green-900">{allPermissions.length}</div>
              <div className="text-sm text-green-700">Total Permissions</div>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-purple-600" />
            <div>
              <div className="text-lg font-semibold text-purple-900">
                {roles.filter(r => r.isSystemRole).length}
              </div>
              <div className="text-sm text-purple-700">System Roles</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
