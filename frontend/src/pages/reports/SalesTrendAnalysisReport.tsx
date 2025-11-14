import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Download,
  TrendingUp,
  Filter,
  Loader2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { salesReportsService } from '@/services/salesReports.service';
import { formatCurrency } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface TrendData {
  trends: Array<{
    period: string;
    totalSales: number;
    totalTransactions: number;
    totalItems: number;
    avgTransactionValue: number;
    salesChange: number;
    salesChangePercent: number;
    transactionsChange: number;
    transactionsChangePercent: number;
  }>;
  summary: {
    totalPeriods: number;
    averageSales: number;
    averageTransactions: number;
    totalSales: number;
    totalTransactions: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
  period: 'day' | 'week' | 'month';
}

function SalesTrendAnalysisReport() {
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [storeId, setStoreId] = useState<string>('');
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

  // Fetch stores for filter
  const { data: storesData } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const response = await api.get('/stores');
      return response.data?.data?.stores || response.data?.stores || [];
    },
  });

  // Fetch sales trend analysis
  const {
    data: reportData,
    isLoading,
    refetch,
  } = useQuery<TrendData>({
    queryKey: ['sales-trend-analysis', startDate, endDate, storeId, period],
    queryFn: () =>
      salesReportsService.getSalesTrendAnalysis({
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        storeId: storeId || undefined,
        period,
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
    totalPeriods: 0,
    averageSales: 0,
    averageTransactions: 0,
    totalSales: 0,
    totalTransactions: 0,
  };

  const trends = reportData?.trends || [];

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="w-4 h-4 text-green-600" />;
    if (change < 0) return <ArrowDown className="w-4 h-4 text-red-600" />;
    return null;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Trend Analysis</h1>
          <p className="text-gray-600 mt-1">
            Analyze sales trends and patterns over time
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'day' | 'week' | 'month')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 opacity-90" />
              </div>
              <p className="text-sm opacity-90 mb-1">Total Periods</p>
              <p className="text-3xl font-bold">{summary.totalPeriods}</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 opacity-90" />
              </div>
              <p className="text-sm opacity-90 mb-1">Average Sales</p>
              <p className="text-3xl font-bold">{formatCurrency(summary.averageSales)}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 opacity-90" />
              </div>
              <p className="text-sm opacity-90 mb-1">Total Sales</p>
              <p className="text-3xl font-bold">{formatCurrency(summary.totalSales)}</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 opacity-90" />
              </div>
              <p className="text-sm opacity-90 mb-1">Avg Transactions</p>
              <p className="text-3xl font-bold">{summary.averageTransactions.toFixed(0)}</p>
            </div>

            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 opacity-90" />
              </div>
              <p className="text-sm opacity-90 mb-1">Total Transactions</p>
              <p className="text-3xl font-bold">{summary.totalTransactions}</p>
            </div>
          </div>

          {/* Trends Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Trend Data ({trends.length} periods)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Sales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sales Change
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transactions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transactions Change
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Transaction Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trends.length > 0 ? (
                    trends.map((trend, index) => (
                      <tr key={`${trend.period}-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {trend.period}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(trend.totalSales)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {getChangeIcon(trend.salesChange)}
                            <span className={`text-sm font-medium ${getChangeColor(trend.salesChange)}`}>
                              {trend.salesChangePercent >= 0 ? '+' : ''}
                              {trend.salesChangePercent.toFixed(1)}%
                            </span>
                            <span className={`text-xs ${getChangeColor(trend.salesChange)}`}>
                              ({formatCurrency(Math.abs(trend.salesChange))})
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {trend.totalTransactions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {getChangeIcon(trend.transactionsChange)}
                            <span className={`text-sm font-medium ${getChangeColor(trend.transactionsChange)}`}>
                              {trend.transactionsChangePercent >= 0 ? '+' : ''}
                              {trend.transactionsChangePercent.toFixed(1)}%
                            </span>
                            <span className={`text-xs ${getChangeColor(trend.transactionsChange)}`}>
                              ({Math.abs(trend.transactionsChange)})
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatCurrency(trend.avgTransactionValue)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No trend data available for the selected date range
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

export default SalesTrendAnalysisReport;

