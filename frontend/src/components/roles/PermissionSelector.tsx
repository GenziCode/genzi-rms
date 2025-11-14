import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, Check, X } from 'lucide-react';
import type { Permission } from '@/services/permissions.service';

interface PermissionSelectorProps {
  permissions: Record<string, Permission[]>;
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
}

export default function PermissionSelector({
  permissions,
  selectedPermissions,
  onChange,
}: PermissionSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const toggleModule = (module: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(module)) {
      newExpanded.delete(module);
    } else {
      newExpanded.add(module);
    }
    setExpandedModules(newExpanded);
  };

  const filteredPermissions = useMemo(() => {
    if (!searchTerm) return permissions;

    const filtered: Record<string, Permission[]> = {};
    Object.entries(permissions).forEach(([module, perms]) => {
      const matching = perms.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          module.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (matching.length > 0) {
        filtered[module] = matching;
      }
    });
    return filtered;
  }, [permissions, searchTerm]);

  const togglePermission = (permissionCode: string) => {
    if (selectedPermissions.includes(permissionCode)) {
      onChange(selectedPermissions.filter((p) => p !== permissionCode));
    } else {
      onChange([...selectedPermissions, permissionCode]);
    }
  };

  const selectAllInModule = (module: string) => {
    const modulePerms = filteredPermissions[module] || [];
    if (!Array.isArray(modulePerms)) return;

    const moduleCodes = modulePerms.map((p) => p.code);
    const allSelected = moduleCodes.every((code) => selectedPermissions.includes(code));

    if (allSelected) {
      onChange(selectedPermissions.filter((p) => !moduleCodes.includes(p)));
    } else {
      const newPerms = [...selectedPermissions];
      moduleCodes.forEach((code) => {
        if (!newPerms.includes(code)) {
          newPerms.push(code);
        }
      });
      onChange(newPerms);
    }
  };

  const selectAll = () => {
    const allCodes = Object.values(filteredPermissions).flat().map((p) => p.code);
    const allSelected = allCodes.every((code) => selectedPermissions.includes(code));

    if (allSelected) {
      onChange([]);
    } else {
      onChange(allCodes);
    }
  };

  const hasWildcard = selectedPermissions.includes('*');

  return (
    <div className="border rounded-lg bg-gray-50">
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-gray-900">
            {selectedPermissions.length} permission{selectedPermissions.length !== 1 ? 's' : ''}{' '}
            selected
          </div>
          <button
            type="button"
            onClick={selectAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {Object.values(filteredPermissions)
              .flat()
              .every((p) => selectedPermissions.includes(p.code))
              ? 'Deselect All'
              : 'Select All'}
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search permissions..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto p-4 space-y-2">
        {hasWildcard && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-900">All Permissions</div>
                <div className="text-xs text-blue-700">Wildcard permission (*) is selected</div>
              </div>
              <button
                type="button"
                onClick={() => onChange(selectedPermissions.filter((p) => p !== '*'))}
                className="p-1 hover:bg-blue-100 rounded"
              >
                <X className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>
        )}

        {Object.entries(filteredPermissions).map(([module, perms]) => {
          // Safety check: ensure perms is an array
          if (!Array.isArray(perms)) {
            console.warn(`Permissions for module ${module} is not an array:`, perms);
            return null;
          }

          const isExpanded = expandedModules.has(module);
          const moduleCodes = perms.map((p) => p.code);
          const selectedCount = moduleCodes.filter((code) => selectedPermissions.includes(code))
            .length;
          const allSelected = moduleCodes.length > 0 && selectedCount === moduleCodes.length;

          return (
            <div key={module} className="bg-white border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleModule(module)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="font-medium text-gray-900 capitalize">{module}</span>
                  <span className="text-xs text-gray-500">
                    ({selectedCount}/{moduleCodes.length})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectAllInModule(module);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
              </button>

              {isExpanded && (
                <div className="border-t divide-y">
                  {perms.map((perm) => {
                    const isSelected = selectedPermissions.includes(perm.code);
                    return (
                      <label
                        key={perm.code}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePermission(perm.code)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{perm.name}</div>
                          <div className="text-xs text-gray-500">
                            <code>{perm.code}</code>
                            {perm.description && ` • ${perm.description}`}
                          </div>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            perm.category === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : perm.category === 'report'
                              ? 'bg-green-100 text-green-800'
                              : perm.category === 'action'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {perm.category}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {Object.keys(filteredPermissions).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No permissions found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
}

