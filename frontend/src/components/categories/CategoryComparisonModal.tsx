import { useState } from 'react';
import { X, GitCompare } from 'lucide-react';
import type { Category } from '@/types/products.types';

interface CategoryComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
}

const CategoryComparisonModal: React.FC<CategoryComparisonModalProps> = ({ 
  isOpen, 
  onClose, 
  categories 
}) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleCategorySelection = (id: string) => {
    setSelectedCategories(prev => 
      prev.includes(id) 
        ? prev.filter(catId => catId !== id) 
        : [...prev, id]
    );
  };

  const selectedCategoryObjects = categories.filter(cat => selectedCategories.includes(cat._id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <GitCompare className="w-6 h-6 mr-2" />
              Category Comparison
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select categories to compare</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
              {categories.map((category) => (
                <div
                  key={category._id}
                  onClick={() => toggleCategorySelection(category._id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                    selectedCategories.includes(category._id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mr-3"
                      style={{ backgroundColor: category.color ? `${category.color}20` : '#3B82F620' }}
                    >
                      {category.icon || '📁'}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                      <p className="text-sm text-gray-500 truncate">{category.description || 'No description'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedCategoryObjects.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Comparison Results ({selectedCategoryObjects.length} selected)
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attribute
                      </th>
                      {selectedCategoryObjects.map((category) => (
                        <th key={category._id} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2"
                              style={{ backgroundColor: category.color ? `${category.color}20` : '#3B82F620' }}
                            >
                              {category.icon}
                            </div>
                            {category.name}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Name
                      </td>
                      {selectedCategoryObjects.map((category) => (
                        <td key={`${category._id}-name`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {category.name}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Description
                      </td>
                      {selectedCategoryObjects.map((category) => (
                        <td key={`${category._id}-desc`} className="px-6 py-4 text-sm text-gray-500">
                          {category.description || '-'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Color
                      </td>
                      {selectedCategoryObjects.map((category) => (
                        <td key={`${category._id}-color`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <div
                              className="w-4 h-4 rounded-full mr-2"
                              style={{ backgroundColor: category.color }}
                            ></div>
                            {category.color}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Icon
                      </td>
                      {selectedCategoryObjects.map((category) => (
                        <td key={`${category._id}-icon`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {category.icon}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Sort Order
                      </td>
                      {selectedCategoryObjects.map((category) => (
                        <td key={`${category._id}-order`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {category.sortOrder}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Status
                      </td>
                      {selectedCategoryObjects.map((category) => (
                        <td key={`${category._id}-status`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              category.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {category.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryComparisonModal;