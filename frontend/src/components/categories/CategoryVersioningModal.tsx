import { useState } from 'react';
import { X, History, RotateCcw, Save, Clock } from 'lucide-react';
import type { Category } from '@/types/products.types';

interface CategoryVersion {
  id: string;
  version: number;
  name: string;
  description: string;
  color: string;
  icon: string;
  parent?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

interface CategoryVersioningModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
  versions: CategoryVersion[];
  onRestoreVersion: (versionId: string) => void;
  onSaveCurrentVersion: () => void;
}

const CategoryVersioningModal: React.FC<CategoryVersioningModalProps> = ({ 
  isOpen, 
  onClose, 
  category, 
  versions, 
  onRestoreVersion,
  onSaveCurrentVersion
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <History className="w-6 h-6 mr-2" />
              Version History: {category.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex space-x-4">
              <button
                onClick={onSaveCurrentVersion}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Current Version
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Version History</h3>
            {versions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No version history available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {versions.map((version) => (
                  <div 
                    key={version.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <h4 className="font-medium text-gray-900">
                            Version {version.version}
                          </h4>
                          <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            {version.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Saved on {new Date(version.createdAt).toLocaleDateString()} by {version.createdBy}
                        </p>
                      </div>
                      <button
                        onClick={() => onRestoreVersion(version.id)}
                        className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Restore
                      </button>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Name:</span> {version.name}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Sort Order:</span> {version.sortOrder}
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Color:</span> 
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-2" 
                            style={{ backgroundColor: version.color }}
                          ></div>
                          {version.color}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Icon:</span> {version.icon}
                      </div>
                    </div>
                    
                    {version.description && (
                      <div className="mt-2">
                        <span className="font-medium text-gray-700">Description:</span>
                        <p className="text-sm text-gray-600 mt-1">{version.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryVersioningModal;