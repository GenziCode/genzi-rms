import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Lock,
  Unlock,
} from 'lucide-react';
import {
  permissionsService,
  type FormPermission,
} from '@/services/permissions.service';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

export default function FormPermissionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['form-permissions'],
    queryFn: () => permissionsService.getForms(),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['form-permissions-categories'],
    queryFn: () => permissionsService.getFormsByCategory(),
  });

  const forms = data?.forms || [];
  const categories = categoriesData ? Object.keys(categoriesData) : [];

  const filteredForms = forms.filter((form) => {
    const matchesSearch =
      form.formName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.formCaption.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (form.module &&
        form.module.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategory === 'all' || form.formCategory === selectedCategory;
    const matchesModule =
      selectedModule === 'all' || form.module === selectedModule;
    return matchesSearch && matchesCategory && matchesModule;
  });

  const modules: string[] = Array.from(
    new Set(
      forms
        .map((f) => f.module)
        .filter(
          (module): module is string =>
            typeof module === 'string' && module.length > 0
        )
    )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Form Permissions</h1>
          <p className="text-gray-600 mt-1">
            Manage form-level access controls and permissions
          </p>
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
              placeholder="Search forms..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

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
        </div>
      </div>

      {/* Forms Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredForms.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No forms found</p>
            </div>
          ) : (
            filteredForms.map((form) => (
              <div
                key={form.formName}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {form.formCaption}
                      </h3>
                      <code className="text-xs text-gray-500">
                        {form.formName}
                      </code>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {form.module && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Module:</span>
                      <span className="px-2 py-1 bg-gray-100 rounded text-gray-700 font-medium">
                        {form.module}
                      </span>
                    </div>
                  )}
                  {form.formCategory && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Category:</span>
                      <span className="text-gray-700">{form.formCategory}</span>
                    </div>
                  )}
                  {form.route && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Route:</span>
                      <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-700">
                        {form.route}
                      </code>
                    </div>
                  )}
                  {form.httpMethods && form.httpMethods.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Methods:</span>
                      <div className="flex gap-1">
                        {form.httpMethods.map((method) => (
                          <span
                            key={method}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                          >
                            {method}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Forms</p>
              <p className="text-2xl font-bold text-gray-900">{forms.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">
                {categories.length}
              </p>
            </div>
            <Filter className="w-8 h-8 text-green-600 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Modules</p>
              <p className="text-2xl font-bold text-gray-900">
                {modules.length}
              </p>
            </div>
            <Eye className="w-8 h-8 text-purple-600 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Filtered</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredForms.length}
              </p>
            </div>
            <Search className="w-8 h-8 text-orange-600 opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
}
