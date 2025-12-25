import { useState } from 'react';
import { 
  Download, 
  Upload, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff, 
  Archive, 
  Tag, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  RotateCcw,
  Package,
  FileText,
  Filter,
  MoreVertical
} from 'lucide-react';
import type { Category } from '@/types/products.types';

interface BulkOperationsToolbarProps {
  selectedCategories: string[];
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkActivate: () => void;
  onBulkDeactivate: () => void;
  onBulkDelete: () => void;
  onBulkExport: () => void;
  onBulkImport: (file: File) => void;
  onBulkUpdate: (updates: Partial<Category>) => void;
  onBulkAssignParent: (parentId: string) => void;
  allCategories: Category[];
  totalSelected: number;
  totalCategories: number;
}

const BulkOperationsToolbar: React.FC<BulkOperationsToolbarProps> = ({
  selectedCategories,
  onSelectAll,
  onClearSelection,
  onBulkActivate,
  onBulkDeactivate,
  onBulkDelete,
  onBulkExport,
  onBulkImport,
  onBulkUpdate,
  onBulkAssignParent,
  allCategories,
  totalSelected,
  totalCategories
}) => {
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [showBulkParentModal, setShowBulkParentModal] = useState(false);
  const [bulkUpdateData, setBulkUpdateData] = useState<Partial<Category>>({});
  const [selectedParent, setSelectedParent] = useState<string>('');

  const handleBulkUpdateSubmit = () => {
    onBulkUpdate(bulkUpdateData);
    setBulkUpdateData({});
    setShowBulkUpdateModal(false);
  };

  const handleBulkParentSubmit = () => {
    if (selectedParent) {
      onBulkAssignParent(selectedParent);
      setSelectedParent('');
      setShowBulkParentModal(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
      {/* Toolbar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={totalSelected === totalCategories && totalSelected > 0}
              onChange={(e) => totalSelected === totalCategories ? onClearSelection() : onSelectAll()}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              {totalSelected > 0
                ? `${totalSelected} selected`
                : 'Select categories to perform bulk operations'}
            </span>
          </div>
          
          {totalSelected > 0 && (
            <button
              onClick={() => onClearSelection()}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear selection
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowBulkActions(!showBulkActions)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Bulk Actions Dropdown */}
      {showBulkActions && (
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <button
              onClick={onBulkActivate}
              disabled={selectedCategories.length === 0}
              className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-5 h-5 text-green-600 mb-1" />
              <span className="text-xs">Activate</span>
            </button>
            
            <button
              onClick={onBulkDeactivate}
              disabled={selectedCategories.length === 0}
              className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-5 h-5 text-yellow-600 mb-1" />
              <span className="text-xs">Deactivate</span>
            </button>
            
            <button
              onClick={() => setShowBulkUpdateModal(true)}
              disabled={selectedCategories.length === 0}
              className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Package className="w-5 h-5 text-blue-600 mb-1" />
              <span className="text-xs">Update</span>
            </button>
            
            <button
              onClick={() => setShowBulkParentModal(true)}
              disabled={selectedCategories.length === 0}
              className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Users className="w-5 h-5 text-purple-600 mb-1" />
              <span className="text-xs">Assign Parent</span>
            </button>
            
            <button
              onClick={onBulkExport}
              disabled={selectedCategories.length === 0}
              className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5 text-indigo-600 mb-1" />
              <span className="text-xs">Export</span>
            </button>
            
            <button
              onClick={onBulkDelete}
              disabled={selectedCategories.length === 0}
              className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-5 h-5 text-red-600 mb-1" />
              <span className="text-xs">Delete</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Bulk Update Modal */}
      {showBulkUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Update Categories</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  value={bulkUpdateData.color || ''}
                  onChange={(e) => setBulkUpdateData({...bulkUpdateData, color: e.target.value})}
                  className="w-full h-10 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon (Emoji)
                </label>
                <input
                  type="text"
                  value={bulkUpdateData.icon || ''}
                  onChange={(e) => setBulkUpdateData({...bulkUpdateData, icon: e.target.value})}
                  placeholder="📁"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={bulkUpdateData.sortOrder?.toString() || ''}
                  onChange={(e) => setBulkUpdateData({
                    ...bulkUpdateData, 
                    sortOrder: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={bulkUpdateData.isActive !== undefined ? bulkUpdateData.isActive.toString() : ''}
                  onChange={(e) => setBulkUpdateData({
                    ...bulkUpdateData,
                    isActive: e.target.value === 'true'
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">No change</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowBulkUpdateModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpdateSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Update Selected ({selectedCategories.length})
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Bulk Assign Parent Modal */}
      {showBulkParentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Parent to Selected Categories</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Parent Category
              </label>
              <select
                value={selectedParent}
                onChange={(e) => setSelectedParent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Select a parent category</option>
                {allCategories
                  .filter(cat => !selectedCategories.includes(cat._id)) // Exclude selected categories
                  .map(category => (
                    <option key={category._id} value={category._id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
              </select>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowBulkParentModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkParentSubmit}
                disabled={!selectedParent}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                Assign Parent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkOperationsToolbar;