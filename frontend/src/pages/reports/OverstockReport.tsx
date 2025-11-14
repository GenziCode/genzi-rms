import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  Package,
  TrendingUp,
  Filter,
  Loader2,
} from 'lucide-react';
import { inventoryReportsService } from '@/services/inventoryReports.service';
import { formatCurrency } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { OverstockReport } from '@/services/inventoryReports.service';

function OverstockReport() {
  const [storeId, setStoreId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');

  // Fetch stores for filter
  const { data: storesData } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const response = await api.get('/stores');
      return response.data?.data?.stores || response.data?.stores || [];
    },
  });

  // Fetch categories for filter
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data?.data?.categories || response.data?.categories || [];
    },
  });

  // Fetch overstock report
  const {
    data: reportData,
    isLoading,
    refetch,
  } = useQuery<OverstockReport>({
    queryKey: ['overstock-report', storeId, categoryId],
    queryFn: () =>
      inventoryReportsService.getOverstockReport({
        storeId: storeId || undefined,
        categoryId: categoryId || undefined,
      }),
  });

  const handleExport = async () => {
    try {
      toast.success('Export functionality coming soon');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const summary = reportData?.summary || {
    totalOverstock: 0,
    totalExcessQuantity: 0,
    totalExcessValue: 0,
  };

  const products = reportData?.products || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Overstock Report</h1>
          <p className="text-gray-600 mt-1">
            Products exceeding maximum stock levels
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store (Optional)
            </label>
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">All Stores</option>
              {storesData?.map((store: any) => (
                <option key={store._id} value={store._id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category (Optional)
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">All Categories</option>
              {categoriesData?.map((cat: any) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Apply Filters
        </button>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading report data...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-8 h-8 opacity-90" />
                <TrendingUp className="w-5 h-5 opacity-75" />
              </div>
              <p className="text-sm opacity-90 mb-1">Overstock Products</p>
              <p className="text-3xl font-bold">{summary.totalOverstock}</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-8 h-8 opacity-90" />
                <TrendingUp className="w-5 h-5 opacity-75" />
              </div>
              <p className="text-sm opacity-90 mb-1">Excess Quantity</p>
              <p className="text-3xl font-bold">{summary.totalExcessQuantity.toLocaleString()}</p>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-8 h-8 opacity-90" />
                <TrendingUp className="w-5 h-5 opacity-75" />
              </div>
              <p className="text-sm opacity-90 mb-1">Excess Value</p>
              <p className="text-3xl font-bold">{formatCurrency(summary.totalExcessValue)}</p>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Overstock Products ({products.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Max Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Excess Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Excess %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Excess Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.length > 0 ? (
                    products.map((product, index) => (
                      <tr key={product.productId || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                            <div className="text-xs text-gray-500">{product.sku}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {product.currentStock.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {product.maxStock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-orange-600">
                          {product.excessStock.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                          {product.excessPercentage.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatCurrency(product.unitCost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                          {formatCurrency(product.excessValue)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        No overstock products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default OverstockReport;

