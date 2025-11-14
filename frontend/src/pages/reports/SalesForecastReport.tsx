import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  TrendingUp,
  Calendar,
  Filter,
  Loader2,
  DollarSign,
  BarChart3,
  Target,
} from 'lucide-react';
import { salesReportsService } from '@/services/salesReports.service';
import { formatCurrency } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface SalesForecast {
  historical: Array<{
    date: string;
    totalSales: number;
    totalTransactions: number;
  }>;
  forecast: Array<{
    date: string;
    forecastedSales: number;
    forecastedTransactions: number;
    confidence: number;
  }>;
  summary: {
    historicalAverage: number;
    forecastedTotal: number;
    forecastedTransactions: number;
    confidence: number;
  };
  forecastDays: number;
}

function SalesForecastReport() {
  const [forecastDays, setForecastDays] = useState<number>(30);
  const [storeId, setStoreId] = useState<string>('');

  // Fetch stores for filter
  const { data: storesData } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const response = await api.get('/stores');
      return response.data?.data?.stores || response.data?.stores || [];
    },
  });

  // Fetch sales forecast
  const {
    data: reportData,
    isLoading,
    refetch,
  } = useQuery<SalesForecast>({
    queryKey: ['sales-forecast', forecastDays, storeId],
    queryFn: () =>
      salesReportsService.getSalesForecast({
        forecastDays,
        storeId: storeId || undefined,
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
    historicalAverage: 0,
    forecastedTotal: 0,
    forecastedTransactions: 0,
    confidence: 0,
  };

  const forecast = reportData?.forecast || [];
  const historical = reportData?.historical || [];

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    const color = getConfidenceColor(confidence);
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color} bg-opacity-10`}>
        {confidence.toFixed(0)}%
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Forecast</h1>
          <p className="text-gray-600 mt-1">
            Predict future sales based on historical data
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
              Forecast Days
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={forecastDays}
              onChange={(e) => setForecastDays(parseInt(e.target.value) || 30)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <p className="text-xs text-gray-500 mt-1">Number of days to forecast (1-365)</p>
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
          <p className="text-gray-600">Loading forecast data...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 opacity-90" />
              </div>
              <p className="text-sm opacity-90 mb-1">Historical Average</p>
              <p className="text-3xl font-bold">{formatCurrency(summary.historicalAverage)}</p>
              <p className="text-xs opacity-75 mt-1">Per day</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8 opacity-90" />
              </div>
              <p className="text-sm opacity-90 mb-1">Forecasted Total</p>
              <p className="text-3xl font-bold">{formatCurrency(summary.forecastedTotal)}</p>
              <p className="text-xs opacity-75 mt-1">Next {forecastDays} days</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-8 h-8 opacity-90" />
              </div>
              <p className="text-sm opacity-90 mb-1">Forecasted Transactions</p>
              <p className="text-3xl font-bold">{summary.forecastedTransactions}</p>
              <p className="text-xs opacity-75 mt-1">Next {forecastDays} days</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8 opacity-90" />
              </div>
              <p className="text-sm opacity-90 mb-1">Confidence</p>
              <p className="text-3xl font-bold">{summary.confidence.toFixed(0)}%</p>
              <p className="text-xs opacity-75 mt-1">Overall accuracy</p>
            </div>
          </div>

          {/* Forecast Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Forecast Details ({forecast.length} days)
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
                      Forecasted Sales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Forecasted Transactions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confidence
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {forecast.length > 0 ? (
                    forecast.map((item) => (
                      <tr key={item.date} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(item.forecastedSales)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.forecastedTransactions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getConfidenceBadge(item.confidence)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        No forecast data available
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

export default SalesForecastReport;

