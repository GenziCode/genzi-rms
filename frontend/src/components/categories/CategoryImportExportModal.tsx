import React, { useState, useRef } from 'react';
import { Download, Upload, FileText, FileSpreadsheet, X } from 'lucide-react';
import { toast } from 'sonner';

interface CategoryImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: any[];
  onExport: (format: 'csv' | 'excel' | 'json') => void;
  onImport: (file: File) => void;
}

const CategoryImportExportModal: React.FC<CategoryImportExportModalProps> = ({
  isOpen,
  onClose,
  categories,
  onExport,
  onImport
}) => {
 const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'json'>('csv');
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    onExport(exportFormat);
    onClose();
  };

  const handleImport = () => {
    if (importFile) {
      onImport(importFile);
      setImportFile(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Import/Export Categories</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-60"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Export Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <Download className="w-5 h-5 mr-2" />
              Export Categories
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'csv' | 'excel' | 'json')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="csv">CSV</option>
                  <option value="excel">Excel</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-70 transition"
              >
                <Download className="w-4 h-4 mr-2" />
                Export {categories.length} Categories
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Import Categories
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {importFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {importFile.name}
                  </p>
                )}
              </div>
              <button
                onClick={handleImport}
                disabled={!importFile}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Categories
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryImportExportModal;
