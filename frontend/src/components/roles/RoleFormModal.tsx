import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { X, Save, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { rolesService, type Role, type CreateRoleRequest, type UpdateRoleRequest } from '@/services/roles.service';
import { permissionsService } from '@/services/permissions.service';
import PermissionSelector from './PermissionSelector';
import { Spinner } from '@/components/ui/spinner';

interface RoleFormModalProps {
  role: Role | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RoleFormModal({
  role,
  isOpen,
  onClose,
  onSuccess,
}: RoleFormModalProps) {
  const [formData, setFormData] = useState<CreateRoleRequest>({
    name: '',
    code: '',
    description: '',
    category: 'custom',
    permissionCodes: [],
    scope: { type: 'all' },
  });

  const { data: permissionsData, isLoading: permissionsLoading, error: permissionsError } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const result = await permissionsService.getGroupedByModule();
      return result;
    },
  });

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        code: role.code,
        description: role.description || '',
        category: role.category,
        permissionCodes: role.permissions || [],
        scope: role.scope,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        category: 'custom',
        permissionCodes: [],
        scope: { type: 'all' },
      });
    }
  }, [role, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: CreateRoleRequest) => rolesService.create(data),
    onSuccess: () => {
      toast.success('Role created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create role');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateRoleRequest) => rolesService.update(role!.id, data),
    onSuccess: () => {
      toast.success('Role updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update role');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.code) {
      toast.error('Name and code are required');
      return;
    }

    if (role) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {role ? 'Edit Role' : 'Create Role'}
                  </h3>
                  <p className="text-sm text-gray-500">Configure role permissions and settings</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Sales Manager"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., SALES_MANAGER"
                    required
                    pattern="[A-Z_]+"
                    title="Uppercase letters and underscores only"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Describe the role's purpose and responsibilities"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as 'system' | 'custom',
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={role?.isSystemRole}
                >
                  <option value="custom">Custom</option>
                  <option value="system">System</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Permissions
                </label>
                {permissionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading permissions...</span>
                  </div>
                ) : permissionsError ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">Failed to load permissions. Please try again.</p>
                  </div>
                ) : (
                  <PermissionSelector
                    permissions={permissionsData || {}}
                    selectedPermissions={Array.isArray(formData.permissionCodes) ? formData.permissionCodes : []}
                    onChange={(permissions) =>
                      setFormData({ ...formData, permissionCodes: permissions })
                    }
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Spinner size="sm" className="text-white" />
                      {role ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {role ? 'Update Role' : 'Create Role'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

