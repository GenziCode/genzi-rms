import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Save, FileText } from 'lucide-react';
import { toast } from 'sonner';
import {
  reportTemplatesService,
  type ReportTemplate,
  type CreateReportTemplateRequest,
  type UpdateReportTemplateRequest,
} from '@/services/reportTemplates.service';
import { Spinner } from '@/components/ui/spinner';

const defaultTemplateFormat: NonNullable<
  CreateReportTemplateRequest['format']
> = {
  showHeader: true,
  showFooter: true,
  showTotals: true,
  pageSize: 50,
  orientation: 'portrait',
};

interface ReportTemplateFormModalProps {
  template: ReportTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReportTemplateFormModal({
  template,
  isOpen,
  onClose,
  onSuccess,
}: ReportTemplateFormModalProps) {
  const [formData, setFormData] = useState<CreateReportTemplateRequest>({
    name: '',
    description: '',
    category: 'custom',
    module: '',
    query: {
      collection: '',
    },
    columns: [],
    filters: [],
    grouping: { enabled: false, fields: [] },
    sorting: { defaultField: '', defaultOrder: 'desc', allowedFields: [] },
    format: { ...defaultTemplateFormat },
  });

  const [changeDescription, setChangeDescription] = useState('');
  const format = formData.format ?? defaultTemplateFormat;

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        category: template.category,
        module: template.module,
        query: template.query,
        columns: template.columns,
        filters: template.filters,
        grouping: template.grouping,
        sorting: template.sorting,
        format: template.format ?? { ...defaultTemplateFormat },
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'custom',
        module: '',
        query: {
          collection: '',
        },
        columns: [],
        filters: [],
        grouping: { enabled: false, fields: [] },
        sorting: { defaultField: '', defaultOrder: 'desc', allowedFields: [] },
        format: { ...defaultTemplateFormat },
      });
    }
    setChangeDescription('');
  }, [template, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: CreateReportTemplateRequest) =>
      reportTemplatesService.create(data),
    onSuccess: () => {
      toast.success('Report template created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || 'Failed to create template'
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateReportTemplateRequest) =>
      reportTemplatesService.update(template!._id, data),
    onSuccess: () => {
      toast.success('Report template updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || 'Failed to update template'
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.module || !formData.query.collection) {
      toast.error('Name, module, and collection are required');
      return;
    }

    if (formData.columns.length === 0) {
      toast.error('At least one column is required');
      return;
    }

    if (template) {
      updateMutation.mutate({
        ...formData,
        changeDescription: changeDescription || undefined,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const addColumn = () => {
    setFormData({
      ...formData,
      columns: [
        ...formData.columns,
        {
          field: '',
          label: '',
          type: 'string',
          visible: true,
          order: formData.columns.length,
        },
      ],
    });
  };

  const removeColumn = (index: number) => {
    setFormData({
      ...formData,
      columns: formData.columns
        .filter((_, i) => i !== index)
        .map((col, i) => ({ ...col, order: i })),
    });
  };

  const updateColumn = (
    index: number,
    updates: Partial<(typeof formData.columns)[0]>
  ) => {
    const newColumns = [...formData.columns];
    newColumns[index] = { ...newColumns[index], ...updates };
    setFormData({ ...formData, columns: newColumns });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {template ? 'Edit Report Template' : 'Create Report Template'}
              </h2>
              <p className="text-sm text-gray-600">
                {template
                  ? 'Update template configuration'
                  : 'Define a new reusable report template'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Daily Sales Summary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target
                          .value as CreateReportTemplateRequest['category'],
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="sales">Sales</option>
                    <option value="inventory">Inventory</option>
                    <option value="financial">Financial</option>
                    <option value="customer">Customer</option>
                    <option value="operational">Operational</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Describe what this report template does..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Module <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.module}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        module: e.target.value.toLowerCase(),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., sales, inventory"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Collection Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.query.collection}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        query: {
                          ...formData.query,
                          collection: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., sales, products"
                    required
                  />
                </div>
              </div>

              {template && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Change Description (optional)
                  </label>
                  <input
                    type="text"
                    value={changeDescription}
                    onChange={(e) => setChangeDescription(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe what changed in this version..."
                  />
                </div>
              )}
            </div>

            {/* Columns Configuration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex-1">
                  Columns Configuration
                </h3>
                <button
                  type="button"
                  onClick={addColumn}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  + Add Column
                </button>
              </div>

              {formData.columns.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No columns defined. Click "Add Column" to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.columns.map((column, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Column {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeColumn(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Field
                          </label>
                          <input
                            type="text"
                            value={column.field}
                            onChange={(e) =>
                              updateColumn(index, { field: e.target.value })
                            }
                            className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500"
                            placeholder="field.path"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Label
                          </label>
                          <input
                            type="text"
                            value={column.label}
                            onChange={(e) =>
                              updateColumn(index, { label: e.target.value })
                            }
                            className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500"
                            placeholder="Display Label"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Type
                          </label>
                          <select
                            value={column.type}
                            onChange={(e) =>
                              updateColumn(index, {
                                type: e.target.value as typeof column.type,
                              })
                            }
                            className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="string">String</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="currency">Currency</option>
                            <option value="percentage">Percentage</option>
                            <option value="boolean">Boolean</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={column.visible}
                            onChange={(e) =>
                              updateColumn(index, { visible: e.target.checked })
                            }
                            className="rounded"
                          />
                          <span>Visible</span>
                        </label>
                        {column.type === 'number' && (
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Aggregate
                            </label>
                            <select
                              value={column.aggregate || ''}
                              onChange={(e) =>
                                updateColumn(index, {
                                  aggregate: e.target
                                    .value as typeof column.aggregate,
                                })
                              }
                              className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">None</option>
                              <option value="sum">Sum</option>
                              <option value="avg">Average</option>
                              <option value="count">Count</option>
                              <option value="min">Min</option>
                              <option value="max">Max</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Format Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Format Options
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={format.showHeader}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          format: { ...format, showHeader: e.target.checked },
                        })
                      }
                      className="rounded"
                    />
                    <span>Show Header</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={format.showFooter}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          format: { ...format, showFooter: e.target.checked },
                        })
                      }
                      className="rounded"
                    />
                    <span>Show Footer</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={format.showTotals}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          format: { ...format, showTotals: e.target.checked },
                        })
                      }
                      className="rounded"
                    />
                    <span>Show Totals</span>
                  </label>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Page Size
                    </label>
                    <input
                      type="number"
                      value={format.pageSize || 50}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          format: {
                            ...format,
                            pageSize: parseInt(e.target.value) || 50,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      min={10}
                      max={1000}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Orientation
                    </label>
                    <select
                      value={format.orientation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          format: {
                            ...format,
                            orientation: e.target.value as
                              | 'portrait'
                              | 'landscape',
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <>
                <Spinner size="sm" className="text-white" />
                {template ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {template ? 'Update Template' : 'Create Template'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
