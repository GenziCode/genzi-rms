import { useState } from 'react';
import {
  Save,
  Eye,
  Download,
  Copy,
  Trash2,
  Plus,
  Layout,
  FileText,
  BarChart3,
  Settings,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  widgets: Array<{
    type: string;
    config: Record<string, any>;
  }>;
  layout: string;
  createdAt: string;
}

export default function TemplateBuilder() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState('sales');

  const categories = [
    { id: 'sales', label: 'Sales', icon: BarChart3 },
    { id: 'inventory', label: 'Inventory', icon: Layout },
    { id: 'financial', label: 'Financial', icon: FileText },
    { id: 'custom', label: 'Custom', icon: Sparkles },
  ];

  const createTemplate = () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    const newTemplate: Template = {
      id: `template-${Date.now()}`,
      name: templateName,
      description: templateDescription,
      category: templateCategory,
      widgets: [],
      layout: 'grid',
      createdAt: new Date().toISOString(),
    };

    setTemplates([...templates, newTemplate]);
    setSelectedTemplate(newTemplate);
    setIsCreating(false);
    setTemplateName('');
    setTemplateDescription('');
    toast.success('Template created successfully');
  };

  const deleteTemplate = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id));
    if (selectedTemplate?.id === id) {
      setSelectedTemplate(null);
    }
    toast.success('Template deleted');
  };

  const duplicateTemplate = (template: Template) => {
    const duplicated: Template = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
    };
    setTemplates([...templates, duplicated]);
    toast.success('Template duplicated');
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 border-b border-indigo-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Template Builder</h2>
              <p className="text-sm text-indigo-100">Create and manage report templates</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Templates List */}
        <div className="w-80 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search templates..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setTemplateCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                      templateCategory === cat.id
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Templates */}
            <div className="space-y-2">
              {templates
                .filter((t) => t.category === templateCategory)
                .map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {template.description || 'No description'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateTemplate(template);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTemplate(template.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{template.widgets.length} widgets</span>
                      <span>•</span>
                      <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
            </div>

            {templates.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No templates yet</p>
                <p className="text-xs mt-1">Create your first template</p>
              </div>
            )}
          </div>
        </div>

        {/* Template Editor */}
        <div className="flex-1 flex flex-col">
          {isCreating ? (
            <div className="flex-1 p-6">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Create New Template</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g., Monthly Sales Report"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      placeholder="Describe what this template is for..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={templateCategory}
                      onChange={(e) => setTemplateCategory(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={createTemplate}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                    >
                      Create Template
                    </button>
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setTemplateName('');
                        setTemplateDescription('');
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedTemplate ? (
            <div className="flex-1 flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedTemplate.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedTemplate.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                    <button className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-6 overflow-auto bg-gray-100">
                <div className="bg-white rounded-xl shadow-sm p-6 min-h-full">
                  <p className="text-gray-500 text-center py-12">
                    Template editor coming soon. Configure widgets, layout, and styling here.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Layout className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Select a template to edit</p>
                <p className="text-sm">Or create a new template to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

