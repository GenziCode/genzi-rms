import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Download,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Filter,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { salesReportsService } from '@/services/salesReports.service';
import { formatCurrency } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { MonthlySalesReport } from '@/services/salesReports.service';

function MonthlySalesReport() {
  const currentDate = new Date();
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1);
  const [year, setYear] = useState<number>(currentDate.getFullYear());
  const [storeId, setStoreId] = useState<string>('');

  // Fetch stores for filter
  const { data: storesData } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const response = await api.get('/stores');
      return response.data?.data?.stores || response.data?.stores || [];
    },
  });

  // Fetch monthly sales report
  const {
    data: reportData,
    isLoading,
    refetch,
  } = useQuery<MonthlySalesReport>({
    queryKey: ['monthly-sales', month, year, storeId],
    queryFn: () =>
      salesReportsService.getMonthlySales({
        month,
        year,
        storeId: storeId || undefined,
      }),
    enabled: !!month && !!year,
  });

  const handleExport = async () => {
    try {
      toast.success('Export functionality coming soon');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const summary = reportData?.summary || {
    totalSales: 0,
    totalTransactions: 0,
    totalItems: 0,
    totalTax: 0,
    totalDiscount: 0,
    avgTransactionValue: 0,
  };

  const comparison = reportData?.comparison || {
    previousYear: { totalSales: 0, totalTransactions: 0 },
    salesChange: 0,
    salesChangePercent: 0,
    transactionsChange: 0,
    transactionsChangePercent: 0,
  };

  const dailyData = reportData?.dailyData || [];
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monthly Sales Report</h1>
          <p className="text-gray-600 mt-1">
            Monthly sales performance with year-over-year comparison
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
              Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(year, m - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              min={2020}
              max={2100}
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
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {monthName} {year}
            </h2>
            <p className="text-sm text-gray-600">Monthly Sales Summary</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 opacity-90" />
                {comparison.salesChangePercent >= 0 ? (
                  <TrendingUp className="w-5 h-5 opacity-75" />
                ) : (
                  <TrendingDown className="w-5 h-5 opacity-75" />
                )}
              </div>
              <p className="text-sm opacity-90 mb-1">Total Sales</p>
              <p className="text-3xl font-bold">{formatCurrency(summary.totalSales)}</p>
              <div className="mt-2 flex items-center gap-1 text-xs">
                {comparison.salesChangePercent >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                <span>
                  {comparison.salesChangePercent >= 0 ? '+' : ''}
                  {comparison.salesChangePercent.toFixed(1)}% vs {year - 1}
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <ShoppingCart className="w-8 h-8 opacity-90" />
                {comparison.transactionsChangePercent >= 0 ? (
                  <TrendingUp className="w-5 h-5 opacity-75" />
                ) : (
                  <TrendingDown className="w-5 h-5 opacity-75" />
                )}
              </div>
              <p className="text-sm opacity-90 mb-1">Total Transactions</p>
              <p className="text-3xl font-bold">{summary.totalTransactions.toLocaleString()}</p>
              <div className="mt-2 flex items-center gap-1 text-xs">
                {comparison.transactionsChangePercent >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                <span>
                  {comparison.transactionsChangePercent >= 0 ? '+' : ''}
                  {comparison.transactionsChangePercent.toFixed(1)}% vs {year - 1}
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <ShoppingCart className="w-8 h-8 opacity-90" />
                <TrendingUp className="w-5 h-5 opacity-75" />
              </div>
              <p className="text-sm opacity-90 mb-1">Total Items</p>
              <p className="text-3xl font-bold">{summary.totalItems.toLocaleString()}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 opacity-90" />
                <TrendingUp className="w-5 h-5 opacity-75" />
              </div>
              <p className="text-sm opacity-90 mb-1">Avg Transaction Value</p>
              <p className="text-3xl font-bold">{formatCurrency(summary.avgTransactionValue)}</p>
            </div>
          </div>

          {/* Year-over-Year Comparison */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Year-over-Year Comparison</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">{monthName} {year - 1}</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Sales:</span>
                    <span className="font-semibold">{formatCurrency(comparison.previousYear.totalSales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Transactions:</span>
                    <span className="font-semibold">{comparison.previousYear.totalTransactions}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">{monthName} {year}</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Sales:</span>
                    <span className="font-semibold">{formatCurrency(summary.totalSales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Transactions:</span>
                    <span className="font-semibold">{summary.totalTransactions}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Sales Change</p>
                  <p
                    className={`text-2xl font-bold ${
                      comparison.salesChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {comparison.salesChange >= 0 ? '+' : ''}
                    {formatCurrency(comparison.salesChange)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Transactions Change</p>
                  <p
                    className={`text-2xl font-bold ${
                      comparison.transactionsChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {comparison.transactionsChange >= 0 ? '+' : ''}
                    {comparison.transactionsChange}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Data Table */}
          {dailyData.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Daily Breakdown</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sales
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transactions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Transaction
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dailyData.map((day, index) => (
                      <tr key={day.date || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Date(day.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(day.totalSales)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {day.totalTransactions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {day.totalItems}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(day.avgTransactionValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MonthlySalesReport;

