import { useMemo, useState } from 'react';
import { Check, X, Shield, Crown, Search, Filter, ChevronDown, ChevronRight, Info } from 'lucide-react';
import type { Role } from '@/services/roles.service';
import type { Permission } from '@/services/permissions.service';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Tooltip from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';

interface PermissionMatrixProps {
  permissions: Record<string, Permission[]>;
  roles: Role[];
  isLoading?: boolean;
}

export default function PermissionMatrix({ permissions, roles, isLoading }: PermissionMatrixProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const allPermissions = useMemo(() => {
    return Object.values(permissions).flat();
  }, [permissions]);

  // Initialize expanded state (all expanded by default)
  useMemo(() => {
    const initialExpanded: Record<string, boolean> = {};
    Object.keys(permissions).forEach(module => {
      initialExpanded[module] = true;
    });
    setExpandedModules(prev => ({ ...initialExpanded, ...prev }));
  }, [permissions]);

  const toggleModule = (module: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [module]: !prev[module]
    }));
  };

  const hasPermission = (role: Role, permissionCode: string) => {
    if (role.permissions?.includes('*')) return true;
    if (role.permissions?.includes(permissionCode)) return true;

    // Check for module wildcard (e.g., product:*)
    const module = permissionCode.split(':')[0];
    if (role.permissions?.includes(`${module}:*`)) return true;

    return false;
  };

  const getRoleIcon = (role: Role) => {
    if (role.isSystemRole) return Crown;
    return Shield;
  };

  const filteredPermissions = useMemo(() => {
    const filtered: Record<string, Permission[]> = {};

    Object.entries(permissions).forEach(([module, modulePerms]) => {
      const matches = modulePerms.filter(p => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = filterCategory === 'all' || p.category === filterCategory;

        return matchesSearch && matchesCategory;
      });

      if (matches.length > 0) {
        filtered[module] = matches;
      }
    });

    return filtered;
  }, [permissions, searchTerm, filterCategory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (roles.length === 0 || allPermissions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
        <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-500">Initialize roles to see the permission matrix.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[800px]">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <div className="flex gap-1">
            {['all', 'crud', 'action', 'admin', 'report', 'system'].map((cat) => (
              <Button
                key={cat}
                variant={filterCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory(cat)}
                className="capitalize text-xs h-8 px-2"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Showing {Object.values(filteredPermissions).flat().length} permissions across {roles.length} roles
        </div>
      </div>

      {/* Matrix */}
      <div className="flex-1 w-full overflow-auto">
        <div className="min-w-[1000px]"> {/* Ensure horizontal scroll for many roles */}
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[400px] sticky left-0 bg-gray-50 border-r border-gray-200 z-30">
                  Permission Details
                </th>
                {roles.map((role) => {
                  const Icon = getRoleIcon(role);
                  return (
                    <th
                      key={role.id}
                      className="px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px] relative group"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={cn(
                          "p-2 rounded-lg transition-colors",
                          role.isSystemRole ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-gray-900 text-sm truncate max-w-[120px]" title={role.name}>
                            {role.name}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">{role.code}</div>
                        </div>
                      </div>
                      {/* Hover effect column highlight */}
                      <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-50 pointer-events-none -z-10" />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(filteredPermissions).map(([module, modulePermissions]) => (
                <div key={module} className="contents">
                  {/* Module Header */}
                  <tr
                    className="bg-gray-50/80 hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => toggleModule(module)}
                  >
                    <td className="px-6 py-3 sticky left-0 bg-gray-50/80 border-r border-gray-200 z-10">
                      <div className="flex items-center gap-2 font-semibold text-gray-700 capitalize">
                        {expandedModules[module] ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                        {module} Module
                        <Badge variant="secondary" className="ml-2 text-[10px] h-5">
                          {modulePermissions.length}
                        </Badge>
                      </div>
                    </td>
                    <td colSpan={roles.length} className="px-4 py-3 text-center text-xs text-gray-400 italic">
                      {expandedModules[module] ? '' : `${modulePermissions.length} permissions hidden`}
                    </td>
                  </tr>

                  {/* Permissions */}
                  {expandedModules[module] && modulePermissions.map((permission) => (
                    <tr key={permission.code} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-3 sticky left-0 bg-white group-hover:bg-blue-50/30 border-r border-gray-200 z-10">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-900">
                              {permission.name}
                            </span>
                            <Tooltip text={permission.description || ''}>
                              <Info className="w-3.5 h-3.5 text-gray-400 hover:text-blue-500 cursor-help" />
                            </Tooltip>
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-mono border border-gray-200">
                              {permission.code}
                            </code>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] h-4 px-1.5 capitalize border-0",
                                permission.category === 'admin' && "bg-purple-100 text-purple-700",
                                permission.category === 'crud' && "bg-blue-100 text-blue-700",
                                permission.category === 'action' && "bg-green-100 text-green-700",
                                permission.category === 'report' && "bg-orange-100 text-orange-700",
                                permission.category === 'system' && "bg-red-100 text-red-700",
                                permission.category === 'finance' && "bg-emerald-100 text-emerald-700",
                              )}
                            >
                              {permission.category}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      {roles.map((role) => {
                        const hasPerm = hasPermission(role, permission.code);
                        return (
                          <td key={`${role.id}-${permission.code}`} className="px-4 py-3 text-center relative">
                            <div className="flex justify-center">
                              {hasPerm ? (
                                <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-sm">
                                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                </div>
                              ) : (
                                <div className="w-6 h-6 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                                </div>
                              )}
                            </div>
                            {/* Column highlight on hover */}
                            <div className="absolute inset-0 bg-blue-50/30 opacity-0 group-hover:opacity-100 pointer-events-none" />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </div>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
