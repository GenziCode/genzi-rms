import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { purchaseOrdersService } from '@/services/purchaseOrders.service';
import { formatCurrency } from '@/lib/utils';
import { POChartCard } from './POChartCard';
import { POStatusChart } from './POStatusChart';
import { POTrendChart } from './POTrendChart';
import { POVendorChart } from './POVendorChart';

interface PODashboardProps {
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export function PODashboard({ dateRange }: PODashboardProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['po-stats', dateRange],
    queryFn: () => purchaseOrdersService.getStats(),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Purchase Orders',
      value: stats?.totalPOs || 0,
      change: stats?.totalPOsChange || 0,
      icon: FileText,
      color: 'blue',
      trend: stats?.totalPOsChange && stats.totalPOsChange > 0 ? 'up' : 'down',
    },
    {
      title: 'Total Value',
      value: formatCurrency(stats?.totalValue || 0),
      change: stats?.totalValueChange || 0,
      icon: DollarSign,
      color: 'green',
      trend: stats?.totalValueChange && stats.totalValueChange > 0 ? 'up' : 'down',
    },
    {
      title: 'Pending Orders',
      value: stats?.pendingPOs || 0,
      change: stats?.pendingPOsChange || 0,
      icon: Clock,
      color: 'yellow',
      trend: stats?.pendingPOsChange && stats.pendingPOsChange > 0 ? 'up' : 'down',
    },
    {
      title: 'Completed Orders',
      value: stats?.completedPOs || 0,
      change: stats?.completedPOsChange || 0,
      icon: CheckCircle2,
      color: 'emerald',
      trend: stats?.completedPOsChange && stats.completedPOsChange > 0 ? 'up' : 'down',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const colorClass = colorClasses[kpi.color as keyof typeof colorClasses];
          const isPositive = kpi.trend === 'up';
          
          return (
            <div
              key={kpi.title}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {kpi.change !== 0 && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isPositive ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    <span>{Math.abs(kpi.change)}%</span>
                  </div>
                )}
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">{kpi.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <POChartCard title="Order Status Distribution">
          <POStatusChart data={stats?.statusDistribution || []} />
        </POChartCard>

        {/* Trend Chart */}
        <POChartCard title="Purchase Orders Trend">
          <POTrendChart data={stats?.trendData || []} />
        </POChartCard>

        {/* Top Vendors */}
        <POChartCard title="Top Vendors by Value" className="lg:col-span-2">
          <POVendorChart data={stats?.topVendors || []} />
        </POChartCard>
      </div>

      {/* Alerts & Notifications */}
      {(stats?.alerts && stats.alerts.length > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">Alerts & Notifications</h3>
          </div>
          <div className="space-y-3">
            {stats.alerts.map((alert: any, index: number) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-900">{alert.title}</p>
                  <p className="text-xs text-yellow-700 mt-1">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

