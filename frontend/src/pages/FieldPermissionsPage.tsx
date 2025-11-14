import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings, Search, Filter, Eye, EyeOff, Edit, Lock, Unlock } from 'lucide-react';
import { permissionsService, type FormPermission, type FieldPermission } from '@/services/permissions.service';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

export default function FieldPermissionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForm, setSelectedForm] = useState<string>('all');

  const { data: formsData } = useQuery({
    queryKey: ['form-permissions-for-fields'],
    queryFn: () => permissionsService.getForms(),
  });

  const { data: fieldsData, isLoading } = useQuery({
    queryKey: ['field-permissions', selectedForm],
    queryFn: async () => {
      if (selectedForm === 'all' || !selectedForm) {
        return { fields: [] };
      }
      return await permissionsService.getFieldsForForm(selectedForm);
    },
    enabled: selectedForm !== 'all' && !!selectedForm,
  });

  const forms = formsData?.forms || [];
  const fields = fieldsData?.fields || [];

  const filteredFields = fields.filter((field) => {
    const matchesSearch =
      field.controlName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      field.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (field.fieldPath && field.fieldPath.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Field Permissions</h1>
          <p className="text-gray-600 mt-1">Manage field-level access controls and visibility</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Form Selector */}
          <select
            value={selectedForm}
            onChange={(e) => setSelectedForm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Select a form to view fields</option>
            {forms.map((form) => (
              <option key={form.formName} value={form.formName}>
                {form.formCaption} ({form.formName})
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fields..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={selectedForm === 'all'}
            />
          </div>
        </div>
      </div>

      {/* Fields List */}
      {selectedForm === 'all' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Select a form to view its field permissions</p>
          <p className="text-sm text-gray-400">Choose a form from the dropdown above</p>
        </div>
      ) : isLoading ? (
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
                    Field
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Control Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Field Path
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visibility
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Editable
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Required
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFields.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No fields found for this form
                    </td>
                  </tr>
                ) : (
                  filteredFields.map((field, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Settings className="w-5 h-5 text-gray-400" />
                          <span className="font-medium text-gray-900">{field.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-gray-700">
                          {field.controlName}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700">{field.controlType}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {field.fieldPath ? (
                          <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-700">
                            {field.fieldPath}
                          </code>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {field.isVisible ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                            <Eye className="w-4 h-4" />
                            Visible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
                            <EyeOff className="w-4 h-4" />
                            Hidden
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {field.isEditable ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                            <Edit className="w-4 h-4" />
                            Editable
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                            <Lock className="w-4 h-4" />
                            Read-only
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {field.isRequired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm">
                            Required
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Optional</span>
                        )}
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
      {selectedForm !== 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Fields</p>
                <p className="text-2xl font-bold text-gray-900">{fields.length}</p>
              </div>
              <Settings className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Visible</p>
                <p className="text-2xl font-bold text-gray-900">
                  {fields.filter((f) => f.isVisible).length}
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Editable</p>
                <p className="text-2xl font-bold text-gray-900">
                  {fields.filter((f) => f.isEditable).length}
                </p>
              </div>
              <Edit className="w-8 h-8 text-purple-600 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Required</p>
                <p className="text-2xl font-bold text-gray-900">
                  {fields.filter((f) => f.isRequired).length}
                </p>
              </div>
              <Lock className="w-8 h-8 text-orange-600 opacity-50" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

