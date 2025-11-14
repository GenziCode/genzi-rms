import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart,
  Activity,
  Zap,
  Target,
  Award,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import KPIWidget from '@/components/dashboard/KPIWidget';
import ChartCard from '@/components/dashboard/ChartCard';
import BarChart from '@/components/charts/BarChart';
import LineChartComponent from '@/components/charts/LineChart';
import PieChart from '@/components/charts/PieChart';
import AreaChart from '@/components/charts/AreaChart';
import { salesReportsService } from '@/services/salesReports.service';
import { formatCurrency } from '@/lib/utils';

interface AdvancedDashboardProps {
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  storeId?: string;
}

export default function AdvancedDashboard({
  dateRange,
  storeId,
}: AdvancedDashboardProps) {
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'transactions' | 'customers'>('revenue');

  // Fetch dashboard data
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['dashboard-sales', dateRange, storeId],
    queryFn: () =>
      salesReportsService.getDailySalesSummary({
        startDate: dateRange?.startDate
          ? new Date(dateRange.startDate).toISOString()
          : undefined,
        endDate: dateRange?.endDate
          ? new Date(dateRange.endDate).toISOString()
          : undefined,
        storeId: storeId || undefined,
      }),
    enabled: !!dateRange,
  });

  const kpis = useMemo(() => {
    if (!salesData) return [];

    return [
      {
        title: 'Total Revenue',
        value: formatCurrency(salesData.summary?.totalSales || 0),
        subtitle: `${salesData.summary?.totalTransactions || 0} transactions`,
        icon: <DollarSign className="w-6 h-6" />,
        color: 'green' as const,
        trend: {
          value: 12.5,
          label: 'vs previous period',
        },
      },
      {
        title: 'Avg Transaction Value',
        value: formatCurrency(salesData.summary?.avgTransactionValue || 0),
        subtitle: 'Per transaction',
        icon: <ShoppingCart className="w-6 h-6" />,
        color: 'blue' as const,
        trend: {
          value: 5.2,
          label: 'vs previous period',
        },
      },
      {
        title: 'Total Items Sold',
        value: (salesData.summary?.totalItems || 0).toLocaleString(),
        subtitle: 'Units',
        icon: <Package className="w-6 h-6" />,
        color: 'purple' as const,
        trend: {
          value: 8.7,
          label: 'vs previous period',
        },
      },
      {
        title: 'Conversion Rate',
        value: '68.5%',
        subtitle: 'Sales efficiency',
        icon: <Target className="w-6 h-6" />,
        color: 'orange' as const,
        trend: {
          value: 3.1,
          label: 'vs previous period',
        },
      },
      {
        title: 'Customer Satisfaction',
        value: '4.8/5',
        subtitle: 'Average rating',
        icon: <Award className="w-6 h-6" />,
        color: 'indigo' as const,
        trend: {
          value: 0.2,
          label: 'vs previous period',
        },
      },
      {
        title: 'Active Alerts',
        value: '3',
        subtitle: 'Requires attention',
        icon: <AlertCircle className="w-6 h-6" />,
        color: 'red' as const,
      },
    ];
  }, [salesData]);

  const charts = useMemo(() => {
    if (!salesData) return [];

    return [
      {
        type: 'line' as const,
        title: 'Revenue Trend',
        description: 'Daily revenue performance over time',
        data: salesData.dailyData || [],
        config: {
          dataKey: 'date',
          lines: [
            { dataKey: 'totalSales', name: 'Revenue', color: '#10b981', strokeWidth: 3 },
            { dataKey: 'totalCost', name: 'Cost', color: '#ef4444', strokeWidth: 2 },
          ],
        },
      },
      {
        type: 'bar' as const,
        title: 'Transaction Volume',
        description: 'Daily transaction count',
        data: salesData.dailyData || [],
        config: {
          dataKey: 'date',
          bars: [
            { dataKey: 'totalTransactions', name: 'Transactions', color: '#3b82f6' },
          ],
        },
      },
      {
        type: 'area' as const,
        title: 'Sales vs Discounts',
        description: 'Revenue and discount trends',
        data: salesData.dailyData || [],
        config: {
          dataKey: 'date',
          areas: [
            { dataKey: 'totalSales', name: 'Sales', color: '#10b981', fillOpacity: 0.6 },
            { dataKey: 'totalDiscount', name: 'Discounts', color: '#f59e0b', fillOpacity: 0.4 },
          ],
          stacked: false,
        },
      },
      {
        type: 'pie' as const,
        title: 'Sales Distribution',
        description: 'Breakdown by category',
        data: [
          { name: 'Products', value: 65 },
          { name: 'Services', value: 25 },
          { name: 'Subscriptions', value: 10 },
        ],
        config: {},
      },
    ];
  }, [salesData]);

  return (
    <div className="space-y-6">
      {/* Metric Selector */}
      <div className="flex items-center gap-2 p-2 bg-white rounded-xl shadow-sm border border-gray-200 w-fit">
        {(['revenue', 'transactions', 'customers'] as const).map((metric) => (
          <button
            key={metric}
            onClick={() => setActiveMetric(metric)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeMetric === metric
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {metric.charAt(0).toUpperCase() + metric.slice(1)}
          </button>
        ))}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, index) => (
          <KPIWidget key={index} {...kpi} loading={isLoading} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {charts.map((chart, index) => (
          <ChartCard
            key={index}
            title={chart.title}
            description={chart.description}
            loading={isLoading}
            className="shadow-lg border-2 border-gray-200"
          >
            {chart.type === 'bar' && (
              <BarChart
                data={chart.data}
                dataKey={chart.config.dataKey}
                bars={chart.config.bars}
                height={300}
              />
            )}
            {chart.type === 'line' && (
              <LineChartComponent
                data={chart.data}
                dataKey={chart.config.dataKey}
                lines={chart.config.lines}
                height={300}
              />
            )}
            {chart.type === 'pie' && (
              <PieChart data={chart.data} height={300} />
            )}
            {chart.type === 'area' && (
              <AreaChart
                data={chart.data}
                dataKey={chart.config.dataKey}
                areas={chart.config.areas}
                height={300}
              />
            )}
          </ChartCard>
        ))}
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-8 h-8 opacity-90" />
            <TrendingUp className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-sm opacity-90 mb-1">Growth Rate</p>
          <p className="text-3xl font-bold">+24.5%</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-8 h-8 opacity-90" />
            <Zap className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-sm opacity-90 mb-1">Efficiency</p>
          <p className="text-3xl font-bold">92%</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 opacity-90" />
            <TrendingUp className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-sm opacity-90 mb-1">New Customers</p>
          <p className="text-3xl font-bold">1,234</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-8 h-8 opacity-90" />
            <Target className="w-5 h-5 opacity-75" />
          </div>
          <p className="text-sm opacity-90 mb-1">Target Achievement</p>
          <p className="text-3xl font-bold">87%</p>
        </div>
      </div>
    </div>
  );
}

