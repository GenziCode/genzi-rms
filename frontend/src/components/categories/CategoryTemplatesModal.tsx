import { useState } from 'react';
import { FolderOpen, Plus, Copy, Download, Upload } from 'lucide-react';
import { categoriesService } from '@/services/categories.service';
import type { Category } from '@/types/products.types';

interface CategoryTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onCreateFromTemplate: (templateId: string, name: string, parent?: string) => void;
  onSaveAsTemplate: (categoryId: string, templateName: string) => void;
}

const CategoryTemplatesModal: React.FC<CategoryTemplatesModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCreateFromTemplate,
  onSaveAsTemplate
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'save'>('create');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState<string>('');
  const [newInstanceName, setNewInstanceName] = useState('');
  const [parentCategory, setParentCategory] = useState<string>('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Category Templates</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-70"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b mb-6">
            <button
              className={`py-2 px-4 font-medium ${
                activeTab === 'create'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('create')}
            >
              Create from Template
            </button>
            <button
              className={`py-2 px-4 font-medium ${
                activeTab === 'save'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-70'
              }`}
              onClick={() => setActiveTab('save')}
            >
              Save as Template
            </button>
          </div>

          {activeTab === 'create' ? (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select a template to create categories</h3>
              
              {/* Template selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Choose a template</option>
                  <option value="template-1">Product Categories</option>
                  <option value="template-2">Service Categories</option>
                </select>
              </div>

              {/* Instance name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Category Name
                </label>
                <input
                  type="text"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                  placeholder="Enter a name for your new category instance"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Parent category */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Category (Optional)
                </label>
                <select
                  value={parentCategory}
                  onChange={(e) => setParentCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">None (Main Category)</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedTemplate && newInstanceName) {
                      onCreateFromTemplate(selectedTemplate, newInstanceName, parentCategory || undefined);
                      onClose();
                    }
                  }}
                  disabled={!selectedTemplate || !newInstanceName}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  Create Categories
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Save a category as a template</h3>
              
              {/* Category selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Category
                </label>
                <select
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Choose a category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Template name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Enter a name for your template"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (templateCategory && newTemplateName) {
                      onSaveAsTemplate(templateCategory, newTemplateName);
                      onClose();
                    }
                  }}
                  disabled={!templateCategory || !newTemplateName}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  Save as Template
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryTemplatesModal;