import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Search, Filter, CheckCircle2, XCircle, Eye, Edit, Trash2, Plus } from 'lucide-react';
import { permissionsService, type Permission } from '@/services/permissions.service';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

export default function PermissionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['permissions', selectedModule],
    queryFn: async () => {
      if (selectedModule === 'all') {
        return await permissionsService.getAll();
      }
      return await permissionsService.getByModule(selectedModule);
    },
  });

  const { data: groupedData } = useQuery({
    queryKey: ['permissions-grouped'],
    queryFn: () => permissionsService.getGroupedByModule(),
  });

  const permissions = data?.permissions || [];
  const modules = groupedData ? Object.keys(groupedData) : [];

  const filteredPermissions = permissions.filter((perm) => {
    const matchesSearch =
      perm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      perm.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      perm.module.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || perm.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'crud':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'action':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'report':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'admin':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getModuleColor = (module: string) => {
    const colors = [
      'bg-blue-50 text-blue-700',
      'bg-green-50 text-green-700',
      'bg-purple-50 text-purple-700',
      'bg-indigo-50 text-indigo-700',
      'bg-pink-50 text-pink-700',
    ];
    const index = modules.indexOf(module) % colors.length;
    return colors[index];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Permissions Management</h1>
          <p className="text-gray-600 mt-1">Manage system permissions and access controls</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search permissions..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Module Filter */}
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Modules</option>
            {modules.map((module) => (
              <option key={module} value={module}>
                {module.charAt(0).toUpperCase() + module.slice(1)}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="crud">CRUD</option>
            <option value="action">Action</option>
            <option value="report">Report</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Permissions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Module
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPermissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No permissions found
                    </td>
                  </tr>
                ) : (
                  filteredPermissions.map((permission) => (
                    <tr key={permission.code} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-gray-400" />
                          <span className="font-medium text-gray-900">{permission.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-gray-700">
                          {permission.code}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-sm font-medium ${getModuleColor(permission.module)}`}>
                          {permission.module}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700">{permission.action}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getCategoryColor(permission.category)}`}>
                          {permission.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{permission.description || '-'}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Permissions</p>
              <p className="text-2xl font-bold text-gray-900">{permissions.length}</p>
            </div>
            <Shield className="w-8 h-8 text-blue-600 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Modules</p>
              <p className="text-2xl font-bold text-gray-900">{modules.length}</p>
            </div>
            <Filter className="w-8 h-8 text-green-600 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Filtered</p>
              <p className="text-2xl font-bold text-gray-900">{filteredPermissions.length}</p>
            </div>
            <Search className="w-8 h-8 text-purple-600 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">CRUD Permissions</p>
              <p className="text-2xl font-bold text-gray-900">
                {permissions.filter((p) => p.category === 'crud').length}
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-orange-600 opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
}

