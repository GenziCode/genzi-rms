import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, ShoppingBag, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { reportsService } from '@/services/reports.service';

export default function LiveSalesCounter() {
  // Auto-refresh every 10 seconds for live feel
  const { data: todayStats } = useQuery({
    queryKey: ['dashboard', 'today'],
    queryFn: () => reportsService.getDashboard({ period: 'today' }),
    refetchInterval: 60000, // 10 seconds
    refetchIntervalInBackground: true,
    staleTime: 5000,
  });

  const stats = {
    totalSales: todayStats?.sales?.total ?? 0,
    ordersCount: todayStats?.sales?.transactions ?? 0,
    averageOrderValue: todayStats?.sales?.avgOrderValue ?? 0,
    salesGrowth: todayStats?.sales?.growth ?? 0,
    totalProducts: todayStats?.products?.total ?? 0,
    lowStockItems: todayStats?.products?.lowStock ?? 0,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Today's Revenue */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-10">
          <DollarSign className="w-32 h-32" />
        </div>
        <div className="relative">
          <p className="text-blue-100 text-sm mb-2">Today's Revenue</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">
              {formatCurrency(stats.totalSales)}
            </p>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>Live</span>
            </div>
          </div>
          <p className="text-blue-100 text-xs mt-2">
            {stats.salesGrowth}% vs yesterday
          </p>
        </div>
      </div>

      {/* Today's Orders */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-10">
          <ShoppingBag className="w-32 h-32" />
        </div>
        <div className="relative">
          <p className="text-green-100 text-sm mb-2">Today's Orders</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">{stats.ordersCount}</p>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
          <p className="text-green-100 text-xs mt-2">
            Avg:{' '}
            {formatCurrency(
              stats.ordersCount > 0 ? stats.totalSales / stats.ordersCount : 0
            )}
          </p>
        </div>
      </div>

      {/* Total Products */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-10">
          <Package className="w-32 h-32" />
        </div>
        <div className="relative">
          <p className="text-purple-100 text-sm mb-2">Total Products</p>
          <p className="text-3xl font-bold">{stats.totalProducts}</p>
          <p className="text-purple-100 text-xs mt-2">
            <span className="text-red-400">{stats.lowStockItems}</span> low
            stock
          </p>
        </div>
      </div>
    </div>
  );
}
