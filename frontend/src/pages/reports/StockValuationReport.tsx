import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  DollarSign,
  Package,
  TrendingUp,
  Filter,
  Loader2,
} from 'lucide-react';
import { inventoryReportsService } from '@/services/inventoryReports.service';
import { formatCurrency } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { StockValuation } from '@/services/inventoryReports.service';

function StockValuationReport() {
  const [storeId, setStoreId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [valuationMethod, setValuationMethod] = useState<string>('average');

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

  // Fetch stock valuation report
  const {
    data: reportData,
    isLoading,
    refetch,
  } = useQuery<StockValuation>({
    queryKey: ['stock-valuation', storeId, categoryId, valuationMethod],
    queryFn: () =>
      inventoryReportsService.getStockValuation({
        storeId: storeId || undefined,
        categoryId: categoryId || undefined,
        valuationMethod: valuationMethod as 'fifo' | 'average' | 'lifo',
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
    totalProducts: 0,
    totalQuantity: 0,
    totalCostValue: 0,
    totalRetailValue: 0,
    totalProfitPotential: 0,
    averageProfitMargin: 0,
  };

  const valuation = reportData?.valuation || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Valuation Report</h1>
          <p className="text-gray-600 mt-1">
            Current inventory value by product/category
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valuation Method
            </label>
            <select
              value={valuationMethod}
              onChange={(e) => setValuationMethod(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="average">Average Cost</option>
              <option value="fifo">FIFO</option>
              <option value="lifo">LIFO</option>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 opacity-90" />
                <TrendingUp className="w-5 h-5 opacity-75" />
              </div>
              <p className="text-sm opacity-90 mb-1">Cost Value</p>
              <p className="text-3xl font-bold">{formatCurrency(summary.totalCostValue)}</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 opacity-90" />
                <TrendingUp className="w-5 h-5 opacity-75" />
              </div>
              <p className="text-sm opacity-90 mb-1">Retail Value</p>
              <p className="text-3xl font-bold">{formatCurrency(summary.totalRetailValue)}</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 opacity-90" />
                <TrendingUp className="w-5 h-5 opacity-75" />
              </div>
              <p className="text-sm opacity-90 mb-1">Profit Potential</p>
              <p className="text-3xl font-bold">{formatCurrency(summary.totalProfitPotential)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 mb-1">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalProducts}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 mb-1">Total Quantity</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalQuantity.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 mb-1">Avg Profit Margin</p>
              <p className="text-2xl font-bold text-green-600">
                {summary.averageProfitMargin.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Valuation Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Product Valuation ({valuation.length})
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
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Retail Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profit Potential
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profit Margin
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {valuation.length > 0 ? (
                    valuation.map((item, index) => (
                      <tr key={item.productId || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                            <div className="text-xs text-gray-500">{item.sku}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.quantity.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatCurrency(item.unitCost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(item.totalCost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(item.totalValue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(item.profitPotential)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`font-medium ${
                              item.profitMargin >= 20
                                ? 'text-green-600'
                                : item.profitMargin >= 10
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                            }`}
                          >
                            {item.profitMargin.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                        No valuation data available
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

export default StockValuationReport;

