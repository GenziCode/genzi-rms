import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Download,
  Percent,
  DollarSign,
  Filter,
  Loader2,
  TrendingDown,
} from 'lucide-react';
import { salesReportsService } from '@/services/salesReports.service';
import { formatCurrency } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface DiscountAnalysis {
  discount: {
    totalTransactions: number;
    totalDiscountAmount: number;
    totalSales: number;
    avgDiscountAmount: number;
    avgDiscountPercent: number;
    discountRate: number;
  };
  allSales: {
    totalTransactions: number;
    totalSales: number;
  };
  impact: {
    discountPercentage: number;
    potentialSalesWithoutDiscount: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

function DiscountAnalysisReport() {
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
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

  // Fetch discount analysis
  const {
    data: reportData,
    isLoading,
    refetch,
  } = useQuery<DiscountAnalysis>({
    queryKey: ['discount-analysis', startDate, endDate, storeId],
    queryFn: () =>
      salesReportsService.getDiscountAnalysis({
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        storeId: storeId || undefined,
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

  const discount = reportData?.discount || {
    totalTransactions: 0,
    totalDiscountAmount: 0,
    totalSales: 0,
    avgDiscountAmount: 0,
    avgDiscountPercent: 0,
    discountRate: 0,
  };

  const allSales = reportData?.allSales || {
    totalTransactions: 0,
    totalSales: 0,
  };

  const impact = reportData?.impact || {
    discountPercentage: 0,
    potentialSalesWithoutDiscount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Discount Analysis</h1>
          <p className="text-gray-600 mt-1">
            Analyze discount usage and its impact on sales
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
                <Percent className="w-8 h-8 opacity-90" />
              </div>
              <p className="text-sm opacity-90 mb-1">Discount Rate</p>
              <p className="text-3xl font-bold">{discount.discountRate.toFixed(1)}%</p>
              <p className="text-xs opacity-75 mt-1">
                {discount.totalTransactions} of {allSales.totalTransactions} transactions
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 opacity-90" />
                <TrendingDown className="w-5 h-5 opacity-75" />
              </div>
              <p className="text-sm opacity-90 mb-1">Total Discount Amount</p>
              <p className="text-3xl font-bold">{formatCurrency(discount.totalDiscountAmount)}</p>
              <p className="text-xs opacity-75 mt-1">
                Avg: {formatCurrency(discount.avgDiscountAmount)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Percent className="w-8 h-8 opacity-90" />
              </div>
              <p className="text-sm opacity-90 mb-1">Avg Discount %</p>
              <p className="text-3xl font-bold">{discount.avgDiscountPercent.toFixed(1)}%</p>
              <p className="text-xs opacity-75 mt-1">Per transaction</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 opacity-90" />
              </div>
              <p className="text-sm opacity-90 mb-1">Potential Sales</p>
              <p className="text-3xl font-bold">{formatCurrency(impact.potentialSalesWithoutDiscount)}</p>
              <p className="text-xs opacity-75 mt-1">
                Without discounts: {formatCurrency(allSales.totalSales)}
              </p>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Detailed Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Discount Transactions</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Transactions with Discount:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {discount.totalTransactions}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Sales (with discount):</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(discount.totalSales)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average Discount Amount:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(discount.avgDiscountAmount)}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Impact Analysis</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Discount as % of Total Sales:</span>
                    <span className="text-sm font-semibold text-red-600">
                      {impact.discountPercentage.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Potential Sales (no discounts):</span>
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(impact.potentialSalesWithoutDiscount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Revenue Impact:</span>
                    <span className="text-sm font-semibold text-red-600">
                      -{formatCurrency(discount.totalDiscountAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DiscountAnalysisReport;

