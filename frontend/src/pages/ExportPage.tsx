import { useState } from 'react';
import { Download, Upload, FileText, Users, Package, TruckIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { exportService } from '@/services/export.service';
import type { ExportEntity, ExportFormat } from '@/types/export.types';

export default function ExportPage() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async (entity: ExportEntity, format: ExportFormat) => {
    try {
      setExporting(true);
      await exportService.exportData({ entity, format });
      toast.success(`${entity} exported successfully`);
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (entity: ExportEntity, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const result = await exportService.importData(entity, file);
      toast.success(`Imported ${result.imported || 0} ${entity} successfully`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const exportOptions = [
    { entity: 'products' as ExportEntity, label: 'Products', icon: Package, color: 'blue' },
    { entity: 'customers' as ExportEntity, label: 'Customers', icon: Users, color: 'green' },
    { entity: 'sales' as ExportEntity, label: 'Sales', icon: FileText, color: 'purple' },
    { entity: 'vendors' as ExportEntity, label: 'Vendors', icon: TruckIcon, color: 'orange' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Data Export & Import</h1>
        <p className="text-gray-600 mt-1">Export and import your business data</p>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Download className="w-6 h-6" />
          Export Data
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exportOptions.map((option) => {
            const Icon = option.icon;
            return (
              <div key={option.entity} className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 bg-${option.color}-100 rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${option.color}-600`} />
                  </div>
                  <h3 className="font-semibold text-gray-900">{option.label}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport(option.entity, 'csv')}
                    disabled={exporting}
                    className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium disabled:opacity-50"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport(option.entity, 'excel')}
                    disabled={exporting}
                    className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium disabled:opacity-50"
                  >
                    Excel
                  </button>
                  <button
                    onClick={() => handleExport(option.entity, 'pdf')}
                    disabled={exporting}
                    className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium disabled:opacity-50"
                  >
                    PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Upload className="w-6 h-6" />
          Import Data
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exportOptions.map((option) => {
            const Icon = option.icon;
            return (
              <div key={option.entity} className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 bg-${option.color}-100 rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${option.color}-600`} />
                  </div>
                  <h3 className="font-semibold text-gray-900">{option.label}</h3>
                </div>
                <label className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => handleImport(option.entity, e)}
                    disabled={importing}
                    className="hidden"
                  />
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

