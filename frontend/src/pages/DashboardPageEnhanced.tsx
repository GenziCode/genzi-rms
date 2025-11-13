import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  UserPlus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { reportsService } from '@/services/reports.service';
import { useAuthStore } from '@/store/authStore';
import logger from '@/utils/logger';
import QuickActionCards from '@/components/dashboard/QuickActionCards';
import RecentActivity from '@/components/dashboard/RecentActivity';
import LiveSalesCounter from '@/components/dashboard/LiveSalesCounter';
import LowStockAlert from '@/components/dashboard/LowStockAlert';
import TopCustomersWidget from '@/components/dashboard/TopCustomersWidget';
import { formatCurrency } from '@/lib/utils';

const DashboardPageEnhanced = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    logger.trackPageView('/dashboard');
  }, []);

  const {
    data: dashboardData,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['dashboard', period],
    queryFn: () => reportsService.getDashboard({ period }),
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
    staleTime: 30000,
    keepPreviousData: true,
    placeholderData: (previousData) => previousData,
  });

  const sales = dashboardData?.sales ?? {};
  const products = dashboardData?.products ?? {};
  const customers = dashboardData?.customers ?? {};

  const stats = {
    totalSales: sales.total ?? 0,
    salesGrowth: sales.growth ?? 0,
    ordersCount: sales.transactions ?? 0,
    averageOrderValue: sales.avgOrderValue ?? 0,
    totalProducts: products.total ?? 0,
    lowStockItems: products.lowStock ?? 0,
    outOfStockItems: products.outOfStock ?? 0,
    totalCustomers: customers.total ?? 0,
    newCustomers: customers.new ?? 0,
  };

  const periodLabel = useMemo(
    () =>
      period === 'today'
        ? 'Today'
        : period === 'week'
          ? 'This Week'
          : 'This Month',
    [period]
  );

  const kpis = useMemo(
    () => [
      {
        title: 'Total Sales',
        value: formatCurrency(stats.totalSales),
        subtitle: periodLabel,
        icon: DollarSign,
        trend:
          stats.salesGrowth !== 0
            ? {
                value: stats.salesGrowth,
                isPositive: stats.salesGrowth >= 0,
                label: 'vs previous',
              }
            : undefined,
        bg: 'from-blue-500 to-blue-600',
      },
      {
        title: 'Orders',
        value: stats.ordersCount.toLocaleString(),
        subtitle: `${stats.ordersCount > 0 ? formatCurrency(stats.totalSales / stats.ordersCount) : formatCurrency(0)} avg ticket`,
        icon: ShoppingCart,
        bg: 'from-green-500 to-green-600',
      },
      {
        title: 'Active Products',
        value: stats.totalProducts.toLocaleString(),
        subtitle: `${stats.lowStockItems} low stock`,
        icon: Package,
        bg: 'from-purple-500 to-purple-600',
      },
      {
        title: 'Customers',
        value: stats.totalCustomers.toLocaleString(),
        subtitle: `${stats.newCustomers} new ${periodLabel.toLowerCase()}`,
        icon: Users,
        trend:
          stats.totalCustomers > 0 && stats.newCustomers > 0
            ? {
                value: Number(
                  (
                    (stats.newCustomers / Math.max(stats.totalCustomers, 1)) *
                    100
                  ).toFixed(1)
                ),
                isPositive: true,
                label: 'growth',
              }
            : undefined,
        bg: 'from-indigo-500 to-indigo-600',
      },
    ],
    [stats, periodLabel]
  );

  const salesTarget = 5000;
  const salesProgress = Math.min((stats.totalSales / salesTarget) * 100, 100);
  const customerGrowthPercent = stats.totalCustomers
    ? Math.min((stats.newCustomers / stats.totalCustomers) * 100, 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName || 'there'}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time overview of your retail performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-500" />
          <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            {(['today', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                  period === p
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[...Array(4)].map((_, idx) => (
            <div
              key={idx}
              className="h-32 rounded-xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
            />
          ))}
        </div>
      )}

      <LiveSalesCounter />

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Quick Actions
        </h2>
        <QuickActionCards />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div
                className={`bg-gradient-to-r ${kpi.bg} px-6 py-4 text-white`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-8 h-8" />
                  {kpi.trend && (
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        kpi.trend.isPositive
                          ? 'bg-white/25 text-white'
                          : 'bg-black/20 text-white'
                      }`}
                    >
                      {kpi.trend.isPositive ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span>
                        {kpi.trend.isPositive ? '+' : ''}
                        {kpi.trend.value}
                        {typeof kpi.trend.value === 'number' ? '%' : ''}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-white/75 text-xs uppercase tracking-wide">
                  {kpi.subtitle}
                </p>
              </div>
              <div className="px-6 py-4">
                <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Sales Performance
                  </p>
                  <h3 className="text-xl font-semibold text-gray-900">
                    ${salesTarget.toLocaleString()}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  {formatCurrency(stats.totalSales)} achieved
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                  style={{ width: `${salesProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-right">
                {salesProgress.toFixed(1)}% of daily target
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Customer Growth
                  </p>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {stats.newCustomers} new customers
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <UserPlus className="w-4 h-4" />
                  {stats.totalCustomers.toLocaleString()} total
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                  style={{ width: `${customerGrowthPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-right">
                {customerGrowthPercent.toFixed(1)}% of customer base added
              </p>
            </div>
          </div>

          <RecentActivity />
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-gray-900">
                  Inventory Snapshot
                </h3>
              </div>
              <button
                onClick={() => navigate('/inventory')}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Manage →
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Products in catalog</span>
                <span className="font-semibold text-gray-900">
                  {stats.totalProducts}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Low stock</span>
                <span className="font-semibold text-yellow-600">
                  {stats.lowStockItems}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Out of stock</span>
                <span className="font-semibold text-red-600">
                  {stats.outOfStockItems}
                </span>
              </div>
            </div>
          </div>

          <LowStockAlert />
          <TopCustomersWidget />
        </div>
      </div>

      {isFetching && !isLoading && (
        <div className="fixed top-6 right-6 z-50">
          <div className="flex items-center gap-2 rounded-full bg-white/90 border border-gray-200 px-3 py-2 shadow">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-xs font-medium text-gray-600">
              Updating dashboard…
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPageEnhanced;
