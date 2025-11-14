import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Search,
  Copy,
  History,
  Filter,
  CheckCircle2,
  XCircle,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { reportTemplatesService, type ReportTemplate } from '@/services/reportTemplates.service';
import { Spinner } from '@/components/ui/spinner';
import ReportTemplateFormModal from '@/components/reports/ReportTemplateFormModal';
import ReportVersionHistoryModal from '@/components/reports/ReportVersionHistoryModal';

export default function ReportTemplatesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: templates, isLoading } = useQuery({
    queryKey: ['report-templates', categoryFilter, statusFilter],
    queryFn: async () => {
      const filters: any = {};
      if (categoryFilter !== 'all') filters.category = categoryFilter;
      if (statusFilter !== 'all') filters.isActive = statusFilter === 'active';
      return await reportTemplatesService.getAll(filters);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: reportTemplatesService.delete,
    onSuccess: () => {
      toast.success('Report template deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete template');
    },
  });

  const cloneMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      reportTemplatesService.clone(id, name),
    onSuccess: () => {
      toast.success('Template cloned successfully');
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to clone template');
    },
  });

  const filteredTemplates =
    templates?.filter(
      (template) =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.module.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sales':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inventory':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'financial':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'customer':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'operational':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'custom':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleEdit = (template: ReportTemplate) => {
    if (template.isSystemTemplate) {
      toast.warning('System templates cannot be edited');
      return;
    }
    setSelectedTemplate(template);
    setShowForm(true);
  };

  const handleDelete = (template: ReportTemplate) => {
    if (template.isSystemTemplate) {
      toast.warning('System templates cannot be deleted');
      return;
    }
    if (window.confirm(`Are you sure you want to delete template "${template.name}"?`)) {
      deleteMutation.mutate(template._id);
    }
  };

  const handleClone = (template: ReportTemplate) => {
    const newName = prompt(`Enter name for cloned template:`, `${template.name} (Copy)`);
    if (newName && newName.trim()) {
      cloneMutation.mutate({ id: template._id, name: newName.trim() });
    }
  };

  const handleViewVersions = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setShowVersionHistory(true);
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'sales', label: 'Sales' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'financial', label: 'Financial' },
    { value: 'customer', label: 'Customer' },
    { value: 'operational', label: 'Operational' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            Report Templates
          </h1>
          <p className="text-gray-600 mt-1">Create and manage reusable report templates</p>
        </div>
        <button
          onClick={() => {
            setSelectedTemplate(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Template
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-lg shadow border">
        {isLoading ? (
          <div className="p-12 text-center">
            <Spinner size="lg" />
            <p className="text-gray-600 mt-4">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first report template to get started'}
            </p>
            {!searchTerm && categoryFilter === 'all' && statusFilter === 'all' && (
              <button
                onClick={() => {
                  setSelectedTemplate(null);
                  setShowForm(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Template
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Template
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Module
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Columns
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Version
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
                {filteredTemplates.map((template) => (
                  <tr key={template._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                          <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {template.name}
                            {template.isSystemTemplate && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                System
                              </span>
                            )}
                          </div>
                          {template.description && (
                            <div className="text-sm text-gray-500 mt-1">{template.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded border ${getCategoryColor(
                          template.category
                        )}`}
                      >
                        {template.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-800">
                        {template.module}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {template.columns.filter((c) => c.visible).length} visible
                      </div>
                      <div className="text-xs text-gray-500">
                        {template.columns.length} total columns
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">v{template.version}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {template.isActive ? (
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
                          onClick={() => handleViewVersions(template)}
                          className="text-purple-600 hover:text-purple-900 p-2 hover:bg-purple-50 rounded-lg transition-colors"
                          title="View version history"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleClone(template)}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Clone template"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        {!template.isSystemTemplate && (
                          <>
                            <button
                              onClick={() => handleEdit(template)}
                              className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg transition-colors"
                              title="Edit template"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(template)}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete template"
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
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
        <ReportTemplateFormModal
          template={selectedTemplate}
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setSelectedTemplate(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setSelectedTemplate(null);
            queryClient.invalidateQueries({ queryKey: ['report-templates'] });
          }}
        />
      )}

      {showVersionHistory && selectedTemplate && (
        <ReportVersionHistoryModal
          templateId={selectedTemplate._id}
          templateName={selectedTemplate.name}
          isOpen={showVersionHistory}
          onClose={() => {
            setShowVersionHistory(false);
            setSelectedTemplate(null);
          }}
        />
      )}
    </div>
  );
}

