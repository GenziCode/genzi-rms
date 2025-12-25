import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { X, Save, Shield, Globe, Layers, Copy, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { rolesService, type Role, type CreateRoleRequest, type UpdateRoleRequest } from '@/services/roles.service';
import { permissionsService } from '@/services/permissions.service';
import PermissionSelector from './PermissionSelector';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';


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
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState<CreateRoleRequest>({
    name: '',
    code: '',
    description: '',
    category: 'custom',
    permissionCodes: [],
    scope: { type: 'all' },
  });

  // Fetch all roles for parent selection
  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesService.getAll(),
    enabled: isOpen,
  });

  const { data: permissionsData, isLoading: permissionsLoading, error: permissionsError } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const result = await permissionsService.getGroupedByModule();
      return result;
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        code: role.code,
        description: role.description || '',
        category: role.category,
        permissionCodes: role.permissions || [],
        scope: role.scope || { type: 'all' },
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
    setActiveTab('general');
  }, [role, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: CreateRoleRequest) => rolesService.create(data),
    onSuccess: () => {
      toast.success('Role created successfully');
      onSuccess();
      onClose();
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
      onClose();
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

  const handleParentRoleChange = (parentId: string) => {
    const parent = rolesData?.roles.find(r => r.id === parentId);
    if (parent && parent.permissions) {
      // Inherit permissions from parent
      setFormData(prev => ({
        ...prev,
        permissionCodes: Array.from(new Set([...(prev.permissionCodes || []), ...parent.permissions]))
      }));
      toast.info(`Inherited ${parent.permissions.length} permissions from ${parent.name}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-gray-100">
          <div className="bg-white flex flex-col h-[85vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-sm">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {role ? 'Edit Role' : 'Create New Role'}
                  </h3>
                  <p className="text-sm text-gray-500">Configure access control and permissions</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="px-6 pt-4 border-b border-gray-100">
                  <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="permissions">Permissions</TabsTrigger>
                    <TabsTrigger value="scope">Scope & Limits</TabsTrigger>
                  </TabsList>
                </div>

                <form id="role-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                  <TabsContent value="general" className="mt-0 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-all"
                            placeholder="e.g., SALES_MANAGER"
                            required
                            pattern="[A-Z0-9_]+"
                            title="Uppercase letters, numbers and underscores only"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) =>
                              setFormData({ ...formData, category: value as 'system' | 'custom' })
                            }
                            disabled={role?.isSystemRole}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="custom">Custom Role</SelectItem>
                              <SelectItem value="system">System Role</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                            rows={4}
                            placeholder="Describe the role's purpose and responsibilities..."
                          />
                        </div>

                        {!role && (
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <label className="block text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                              <Copy className="w-4 h-4" />
                              Clone from Parent Role
                            </label>
                            <Select onValueChange={handleParentRoleChange}>
                              <SelectTrigger className="bg-white border-blue-200">
                                <SelectValue placeholder="Select a role to clone..." />
                              </SelectTrigger>
                              <SelectContent>
                                {rolesData?.roles?.map(r => (
                                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-blue-700 mt-2">
                              Selecting a role will copy its permissions to this new role.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="permissions" className="mt-0 h-full flex flex-col">
                    <div className="flex-1 min-h-[400px]">
                      {permissionsLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <Spinner size="lg" />
                        </div>
                      ) : permissionsError ? (
                        <div className="text-center text-red-500 p-8">
                          Failed to load permissions
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
                  </TabsContent>

                  <TabsContent value="scope" className="mt-0 space-y-6">
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                      <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-gray-500" />
                        Data Access Scope
                      </h4>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                          <div>
                            <div className="font-medium text-gray-900">Global Access</div>
                            <div className="text-sm text-gray-500">Access data from all stores and departments</div>
                          </div>
                          <Switch
                            checked={formData.scope?.type === 'all'}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, scope: { type: checked ? 'all' : 'store' } })
                            }
                          />
                        </div>

                        {formData.scope?.type !== 'all' && (
                          <div className="pl-4 border-l-2 border-gray-200 space-y-4 animate-in slide-in-from-left-2 duration-200">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Store Access Type
                              </label>
                              <Select
                                value={formData.scope?.type}
                                onValueChange={(value) =>
                                  setFormData({ ...formData, scope: { ...formData.scope, type: value as any } })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select scope type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="store">Specific Stores</SelectItem>
                                  <SelectItem value="department">Department Level</SelectItem>
                                  <SelectItem value="custom">Custom Rules</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800 border border-yellow-100">
                              Note: Granular scope selection (Store/Department picker) will be available in the next update.
                              Currently defaults to "Assigned Store".
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </form>
              </Tabs>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {formData.permissionCodes?.length || 0} permissions selected
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="role-form"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Spinner size="sm" className="text-white" />
                      {role ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {role ? 'Save Changes' : 'Create Role'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
