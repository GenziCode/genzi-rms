import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  Filter,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  ShoppingCart,
} from 'lucide-react';
import { salesReportsService } from '@/services/salesReports.service';
import { formatCurrency } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { SalesComparison } from '@/services/salesReports.service';

function SalesComparisonReport() {
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(today.getMonth() - 1);

  const [period1Start, setPeriod1Start] = useState<string>(
    lastMonth.toISOString().split('T')[0]
  );
  const [period1End, setPeriod1End] = useState<string>(
    new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0]
  );
  const [period2Start, setPeriod2Start] = useState<string>(
    today.toISOString().split('T')[0]
  );
  const [period2End, setPeriod2End] = useState<string>(
    today.toISOString().split('T')[0]
  );
  const [storeId, setStoreId] = useState<string>('');

  // Fetch stores for filter
  const { data: storesData } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const response = await api.get('/stores');
      return response.data?.data?.stores || response.data?.stores || [];
    },
  });

  // Fetch sales comparison report
  const {
    data: reportData,
    isLoading,
    refetch,
  } = useQuery<SalesComparison>({
    queryKey: ['sales-comparison', period1Start, period1End, period2Start, period2End, storeId],
    queryFn: () =>
      salesReportsService.getSalesComparison({
        period1Start: new Date(period1Start).toISOString(),
        period1End: new Date(period1End).toISOString(),
        period2Start: new Date(period2Start).toISOString(),
        period2End: new Date(period2End).toISOString(),
        storeId: storeId || undefined,
      }),
    enabled: !!period1Start && !!period1End && !!period2Start && !!period2End,
  });

  const handleExport = async () => {
    try {
      toast.success('Export functionality coming soon');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const period1 = reportData?.period1 || {
    totalSales: 0,
    totalTransactions: 0,
    totalItems: 0,
    totalTax: 0,
    totalDiscount: 0,
    avgTransactionValue: 0,
  };

  const period2 = reportData?.period2 || {
    totalSales: 0,
    totalTransactions: 0,
    totalItems: 0,
    totalTax: 0,
    totalDiscount: 0,
    avgTransactionValue: 0,
  };

  const comparison = reportData?.comparison || {
    salesChange: 0,
    salesChangePercent: 0,
    transactionsChange: 0,
    transactionsChangePercent: 0,
    itemsChange: 0,
    itemsChangePercent: 0,
    avgTransactionChange: 0,
    avgTransactionChangePercent: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Comparison</h1>
          <p className="text-gray-600 mt-1">
            Compare sales performance between two time periods
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Period 1</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={period1Start}
                  onChange={(e) => setPeriod1Start(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={period1End}
                  onChange={(e) => setPeriod1End(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Period 2</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={period2Start}
                  onChange={(e) => setPeriod2Start(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={period2End}
                  onChange={(e) => setPeriod2End(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mb-4">
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
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Calendar className="w-4 h-4" />
          Apply Filters
        </button>
      </div>

      {/* Comparison Results */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading comparison data...</p>
        </div>
      ) : (
        <>
          {/* Key Metrics Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-6 h-6 text-gray-400" />
                {comparison.salesChangePercent >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">Sales Change</p>
              <p
                className={`text-2xl font-bold ${
                  comparison.salesChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {comparison.salesChange >= 0 ? '+' : ''}
                {comparison.salesChangePercent.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {comparison.salesChange >= 0 ? '+' : ''}
                {formatCurrency(comparison.salesChange)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <ShoppingCart className="w-6 h-6 text-gray-400" />
                {comparison.transactionsChangePercent >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">Transactions Change</p>
              <p
                className={`text-2xl font-bold ${
                  comparison.transactionsChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {comparison.transactionsChangePercent >= 0 ? '+' : ''}
                {comparison.transactionsChangePercent.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {comparison.transactionsChange >= 0 ? '+' : ''}
                {comparison.transactionsChange}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <ShoppingCart className="w-6 h-6 text-gray-400" />
                {comparison.itemsChangePercent >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">Items Change</p>
              <p
                className={`text-2xl font-bold ${
                  comparison.itemsChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {comparison.itemsChangePercent >= 0 ? '+' : ''}
                {comparison.itemsChangePercent.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {comparison.itemsChange >= 0 ? '+' : ''}
                {comparison.itemsChange.toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-6 h-6 text-gray-400" />
                {comparison.avgTransactionChangePercent >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">Avg Transaction Change</p>
              <p
                className={`text-2xl font-bold ${
                  comparison.avgTransactionChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {comparison.avgTransactionChangePercent >= 0 ? '+' : ''}
                {comparison.avgTransactionChangePercent.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {comparison.avgTransactionChange >= 0 ? '+' : ''}
                {formatCurrency(comparison.avgTransactionChange)}
              </p>
            </div>
          </div>

          {/* Detailed Comparison Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Detailed Comparison</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Metric
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period 1
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period 2
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change %
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Total Sales
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatCurrency(period1.totalSales)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatCurrency(period2.totalSales)}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                        comparison.salesChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {comparison.salesChange >= 0 ? '+' : ''}
                      {formatCurrency(comparison.salesChange)}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                        comparison.salesChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {comparison.salesChangePercent >= 0 ? '+' : ''}
                      {comparison.salesChangePercent.toFixed(1)}%
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Total Transactions
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {period1.totalTransactions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {period2.totalTransactions}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                        comparison.transactionsChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {comparison.transactionsChange >= 0 ? '+' : ''}
                      {comparison.transactionsChange}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                        comparison.transactionsChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {comparison.transactionsChangePercent >= 0 ? '+' : ''}
                      {comparison.transactionsChangePercent.toFixed(1)}%
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Total Items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {period1.totalItems.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {period2.totalItems.toLocaleString()}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                        comparison.itemsChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {comparison.itemsChange >= 0 ? '+' : ''}
                      {comparison.itemsChange.toLocaleString()}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                        comparison.itemsChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {comparison.itemsChangePercent >= 0 ? '+' : ''}
                      {comparison.itemsChangePercent.toFixed(1)}%
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Avg Transaction Value
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatCurrency(period1.avgTransactionValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatCurrency(period2.avgTransactionValue)}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                        comparison.avgTransactionChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {comparison.avgTransactionChange >= 0 ? '+' : ''}
                      {formatCurrency(comparison.avgTransactionChange)}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                        comparison.avgTransactionChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {comparison.avgTransactionChangePercent >= 0 ? '+' : ''}
                      {comparison.avgTransactionChangePercent.toFixed(1)}%
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Total Tax
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatCurrency(period1.totalTax)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatCurrency(period2.totalTax)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatCurrency(period2.totalTax - period1.totalTax)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {period1.totalTax > 0
                        ? (((period2.totalTax - period1.totalTax) / period1.totalTax) * 100).toFixed(1)
                        : '0.0'}
                      %
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Total Discount
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatCurrency(period1.totalDiscount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatCurrency(period2.totalDiscount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatCurrency(period2.totalDiscount - period1.totalDiscount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {period1.totalDiscount > 0
                        ? (((period2.totalDiscount - period1.totalDiscount) / period1.totalDiscount) *
                            100
                          ).toFixed(1)
                        : '0.0'}
                      %
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default SalesComparisonReport;

