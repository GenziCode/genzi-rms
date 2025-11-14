import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { rolesService, type Role } from '@/services/roles.service';
import RoleFormModal from '@/components/roles/RoleFormModal';
import { Spinner } from '@/components/ui/spinner';
import { useHasPermission } from '@/hooks/usePermissions';
import { useAuthStore } from '@/store/authStore';

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuthStore();
  const canManageRoles =
    user?.role === 'owner' ||
    user?.role === 'admin' ||
    useHasPermission('*') ||
    useHasPermission('role:*');

  const { data, isLoading } = useQuery({
    queryKey: ['roles', searchTerm],
    queryFn: async () => {
      const result = await rolesService.getAll();
      if (searchTerm) {
        return {
          roles: result.roles.filter(
            (role) =>
              role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              role.code.toLowerCase().includes(searchTerm.toLowerCase())
          ),
        };
      }
      return result;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: rolesService.delete,
    onSuccess: () => {
      toast.success('Role deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || 'Failed to delete role'
      );
    },
  });

  const roles = data?.roles || [];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'system':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'custom':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleEdit = (role: Role) => {
    if (role.isSystemRole) {
      toast.warning('System roles cannot be edited');
      return;
    }
    setSelectedRole(role);
    setShowForm(true);
  };

  const handleDelete = (role: Role) => {
    if (role.isSystemRole) {
      toast.warning('System roles cannot be deleted');
      return;
    }
    if (
      window.confirm(`Are you sure you want to delete role "${role.name}"?`)
    ) {
      deleteMutation.mutate(role.id);
    }
  };

  if (!canManageRoles) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <Shield className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            Access Denied
          </h3>
          <p className="text-yellow-700">
            You don't have permission to manage roles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            Roles & Permissions
          </h1>
          <p className="text-gray-600 mt-1">
            Manage roles and their permissions
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedRole(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Role
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search roles..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border">
        {isLoading ? (
          <div className="p-12 text-center">
            <Spinner size="lg" />
            <p className="text-gray-600 mt-4">Loading roles...</p>
          </div>
        ) : roles.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No roles found
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first role to get started
            </p>
            <button
              onClick={() => {
                setSelectedRole(null);
                setShowForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Role
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                          <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {role.name}
                          </div>
                          {role.description && (
                            <div className="text-sm text-gray-500">
                              {role.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-800">
                        {role.code}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded border ${getCategoryColor(
                          role.category
                        )}`}
                      >
                        {role.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {role.permissions.length} permission
                        {role.permissions.length !== 1 ? 's' : ''}
                      </div>
                      {role.permissions.includes('*') && (
                        <div className="text-xs text-blue-600 mt-1">
                          All permissions
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {role.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(role)}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit role"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {!role.isSystemRole && (
                          <button
                            onClick={() => handleDelete(role)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete role"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <RoleFormModal
          role={selectedRole}
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setSelectedRole(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setSelectedRole(null);
            queryClient.invalidateQueries({ queryKey: ['roles'] });
          }}
        />
      )}
    </div>
  );
}
