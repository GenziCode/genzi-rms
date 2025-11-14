import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Download,
  ArrowDownCircle,
  ArrowUpCircle,
  Filter,
  Loader2,
  Package,
} from 'lucide-react';
import { inventoryReportsService } from '@/services/inventoryReports.service';
import { formatCurrency } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { StockMovement } from '@/services/inventoryReports.service';

function StockMovementReport() {
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [productId, setProductId] = useState<string>('');
  const [storeId, setStoreId] = useState<string>('');
  const [movementType, setMovementType] = useState<string>('');

  // Fetch stores for filter
  const { data: storesData } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const response = await api.get('/stores');
      return response.data?.data?.stores || response.data?.stores || [];
    },
  });

  // Fetch stock movement report
  const {
    data: reportData,
    isLoading,
    refetch,
  } = useQuery<StockMovement>({
    queryKey: ['stock-movement', startDate, endDate, productId, storeId, movementType],
    queryFn: () =>
      inventoryReportsService.getStockMovement({
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        productId: productId || undefined,
        storeId: storeId || undefined,
        movementType: movementType ? (movementType as 'in' | 'out' | 'adjustment') : undefined,
      }),
    enabled: !!startDate && !!endDate,
  });

  const handleExport = async () => {
    try {
      toast.success('Export functionality coming soon');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const summary = reportData?.summary || {
    totalMovements: 0,
    stockIn: 0,
    stockOut: 0,
    netMovement: 0,
  };

  const movements = reportData?.movements || [];

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <ArrowDownCircle className="w-4 h-4 text-green-600" />;
      case 'out':
        return <ArrowUpCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Movement Report</h1>
          <p className="text-gray-600 mt-1">
            Track stock movements (in/out) over time
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
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
              Movement Type
            </label>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">All Types</option>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Calendar className="w-4 h-4" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-8 h-8 opacity-90" />
              </div>
              <p className="text-sm opacity-90 mb-1">Total Movements</p>
              <p className="text-3xl font-bold">{summary.totalMovements}</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <ArrowDownCircle className="w-8 h-8 opacity-90" />
              </div>
              <p className="text-sm opacity-90 mb-1">Stock In</p>
              <p className="text-3xl font-bold">{summary.stockIn.toLocaleString()}</p>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <ArrowUpCircle className="w-8 h-8 opacity-90" />
              </div>
              <p className="text-sm opacity-90 mb-1">Stock Out</p>
              <p className="text-3xl font-bold">{summary.stockOut.toLocaleString()}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-8 h-8 opacity-90" />
              </div>
              <p className="text-sm opacity-90 mb-1">Net Movement</p>
              <p
                className={`text-3xl font-bold ${
                  summary.netMovement >= 0 ? 'text-white' : 'text-red-200'
                }`}
              >
                {summary.netMovement >= 0 ? '+' : ''}
                {summary.netMovement.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Movements Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Stock Movements ({movements.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Cost/Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movements.length > 0 ? (
                    movements.map((movement, index) => (
                      <tr key={`${movement.date}-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(movement.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getMovementIcon(movement.type)}
                            <span className="text-sm font-medium capitalize text-gray-900">
                              {movement.type}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {movement.reference}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {movement.productName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {movement.quantity.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {movement.unitCost
                            ? formatCurrency(movement.unitCost)
                            : movement.unitPrice
                              ? formatCurrency(movement.unitPrice)
                              : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {movement.totalCost
                            ? formatCurrency(movement.totalCost)
                            : movement.totalValue
                              ? formatCurrency(movement.totalValue)
                              : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No stock movements found for the selected date range
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

export default StockMovementReport;

