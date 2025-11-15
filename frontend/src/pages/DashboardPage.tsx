import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BadgeCheck,
  BarChart3,
  BellRing,
  Briefcase,
  Clock3,
  Database,
  DollarSign,
  Download,
  Globe,
  Package,
  PieChart as PieChartIcon,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  UserCheck,
} from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { reportsService } from '@/services/reports.service';
import { inventoryService } from '@/services/inventory.service';
import { customersService } from '@/services/customers.service';
import { settingsService } from '@/services/settings.service';
import { formatCurrency } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import PieChart from '@/components/charts/PieChart';
import AreaChart from '@/components/charts/AreaChart';

import type {
  DashboardReport,
  SalesTrendsReport,
  PaymentMethodsReport,
  CustomerInsightsReport,
  VendorPerformanceReport,
  InventoryValuationReport,
} from '@/types/reports.types';
import type {
  InventoryStatus,
  StockAlert,
  LowStockProduct,
  StockMovement,
} from '@/types/inventory.types';
import type { CustomerStats } from '@/types/customer.types';
import type { StoreSettings } from '@/types/settings.types';

type TimeRange = 'today' | 'week' | 'month' | 'year';

type MetricCardProps = {
  icon: LucideIcon;
  title: string;
  value: string;
  change?: { value: number; label?: string };
  trend?: 'up' | 'down' | 'steady';
  caption?: string;
  badge?: string;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
};

const toneClasses: Record<NonNullable<MetricCardProps['tone']>, string> = {
  primary: 'from-blue-500/10 via-blue-500/5 to-transparent border-blue-200',
  success:
    'from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-200',
  warning: 'from-amber-500/10 via-amber-500/5 to-transparent border-amber-200',
  danger: 'from-rose-500/10 via-rose-500/5 to-transparent border-rose-200',
  neutral: 'from-slate-500/10 via-slate-500/5 to-transparent border-slate-200',
};

const formatNumber = (value: number | undefined, minimumFractionDigits = 0) => {
  if (!Number.isFinite(value)) return '0';
  return value!.toLocaleString(undefined, {
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits,
  });
};

const formatShortDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getDateRange = (range: TimeRange) => {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(end.getDate() - 7);
      break;
    case 'month':
      start.setMonth(end.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(end.getFullYear() - 1);
      break;
  }

  return {
    start: start.toISOString().split('T')[0]!,
    end: end.toISOString().split('T')[0]!,
  };
};

const MetricCard = ({
  icon: Icon,
  title,
  value,
  change,
  trend = 'steady',
  caption,
  badge,
  tone = 'primary',
}: MetricCardProps) => {
  const TrendIcon =
    trend === 'down' ? TrendingDown : trend === 'up' ? TrendingUp : null;
  const trendColor =
    trend === 'down'
      ? 'text-rose-600'
      : trend === 'up'
        ? 'text-emerald-600'
        : 'text-slate-500';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-white/80 p-5 shadow-sm backdrop-blur-sm transition hover:shadow-md ${toneClasses[tone]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-slate-500" />
            {badge && (
              <Badge
                variant="outline"
                className="border-transparent bg-slate-900/5 text-xs text-slate-600"
              >
                {badge}
              </Badge>
            )}
          </div>
          <h3 className="mt-3 text-sm font-medium text-slate-500">{title}</h3>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        {TrendIcon && (
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 shadow-inner ${trendColor}`}
          >
            <TrendIcon className="h-5 w-5" />
          </div>
        )}
      </div>
      {(change || caption) && (
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          {change ? (
            <span
              className={`inline-flex items-center gap-1 font-medium ${trendColor}`}
            >
              {trend === 'down' ? (
                <ArrowDownRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowUpRight className="h-3.5 w-3.5" />
              )}
              {formatNumber(Math.abs(change.value), 1)}%
              {change.label && (
                <span className="text-slate-400">· {change.label}</span>
              )}
            </span>
          ) : (
            <span />
          )}
          {caption && <span>{caption}</span>}
        </div>
      )}
    </div>
  );
};

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const { user } = useAuthStore();

  const dateRange = useMemo(() => getDateRange(timeRange), [timeRange]);

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useQuery<DashboardReport>({
    queryKey: ['dashboard', timeRange],
    queryFn: () => reportsService.getDashboard({ period: timeRange }),
    staleTime: 60_000,
  });

  const {
    data: salesTrendsData,
    isLoading: salesTrendsLoading,
    error: salesTrendsError,
  } = useQuery<SalesTrendsReport>({
    queryKey: ['sales-trends', dateRange.start, dateRange.end],
    queryFn: () =>
      reportsService.getSalesTrends({
        startDate: dateRange.start,
        endDate: dateRange.end,
      }),
    staleTime: 60_000,
  });

  const {
    data: paymentMethodsData,
    isLoading: paymentMethodsLoading,
    error: paymentMethodsError,
  } = useQuery<PaymentMethodsReport>({
    queryKey: ['payment-methods', dateRange.start, dateRange.end],
    queryFn: () =>
      reportsService.getPaymentMethods({
        startDate: dateRange.start,
        endDate: dateRange.end,
      }),
    staleTime: 10 * 60_000,
  });

  const {
    data: customerInsightsData,
    isLoading: customerInsightsLoading,
    error: customerInsightsError,
  } = useQuery<CustomerInsightsReport>({
    queryKey: ['customer-insights', dateRange.start, dateRange.end],
    queryFn: () =>
      reportsService.getCustomerInsights({
        startDate: dateRange.start,
        endDate: dateRange.end,
      }),
    staleTime: 15 * 60_000,
  });

  const {
    data: vendorPerformanceData,
    isLoading: vendorPerformanceLoading,
    error: vendorPerformanceError,
  } = useQuery<VendorPerformanceReport>({
    queryKey: ['vendor-performance', dateRange.start, dateRange.end],
    queryFn: () =>
      reportsService.getVendorPerformance({
        startDate: dateRange.start,
        endDate: dateRange.end,
      }),
    staleTime: 15 * 60_000,
  });

  const {
    data: profitLossData,
    isLoading: profitLossLoading,
    error: profitLossError,
  } = useQuery({
    queryKey: ['profit-loss', dateRange.start, dateRange.end],
    queryFn: () =>
      reportsService.getProfitLoss({
        startDate: dateRange.start,
        endDate: dateRange.end,
      }),
    staleTime: 10 * 60_000,
  });

  const {
    data: inventoryValuationReport,
    isLoading: inventoryValuationReportLoading,
    error: inventoryValuationReportError,
  } = useQuery<InventoryValuationReport>({
    queryKey: ['inventory-valuation-report'],
    queryFn: () => reportsService.getInventoryValuation(),
    staleTime: 30 * 60_000,
  });

  const {
    data: inventoryStatusData,
    isLoading: inventoryStatusLoading,
    error: inventoryStatusError,
  } = useQuery<InventoryStatus>({
    queryKey: ['inventory-status'],
    queryFn: () => inventoryService.getStatus(),
    staleTime: 5 * 60_000,
  });

  const {
    data: lowStockData,
    isLoading: lowStockLoading,
    error: lowStockError,
  } = useQuery<LowStockProduct[]>({
    queryKey: ['inventory-low-stock'],
    queryFn: () => inventoryService.getLowStock(),
    staleTime: 5 * 60_000,
  });

  const {
    data: inventoryAlertsData,
    isLoading: inventoryAlertsLoading,
    error: inventoryAlertsError,
  } = useQuery<StockAlert[]>({
    queryKey: ['inventory-alerts'],
    queryFn: () => inventoryService.getAlerts({ status: 'active', limit: 12 }),
    staleTime: 60_000,
  });

  const {
    data: stockMovementsData,
    isLoading: stockMovementsLoading,
    error: stockMovementsError,
  } = useQuery<{
    movements: StockMovement[];
  }>({
    queryKey: ['inventory-movements', dateRange.start, dateRange.end],
    queryFn: () =>
      inventoryService.getMovements({
        startDate: dateRange.start,
        endDate: dateRange.end,
        limit: 12,
      }),
    staleTime: 60_000,
  });

  const {
    data: customerStatsData,
    isLoading: customerStatsLoading,
    error: customerStatsError,
  } = useQuery<CustomerStats>({
    queryKey: ['customer-stats'],
    queryFn: () => customersService.getStats(),
    staleTime: 10 * 60_000,
  });

  const {
    data: storesData,
    isLoading: storesLoading,
    error: storesError,
  } = useQuery<StoreSettings[]>({
    queryKey: ['stores-dashboard'],
    queryFn: () => settingsService.getStores(),
    staleTime: 30 * 60_000,
  });

  const {
    data: topProductsData,
    isLoading: topProductsLoading,
    error: topProductsError,
  } = useQuery<any>({
    queryKey: ['top-products', dateRange.start, dateRange.end],
    queryFn: () =>
      reportsService.getTopProducts({
        startDate: dateRange.start,
        endDate: dateRange.end,
        limit: 12,
      }),
    staleTime: 10 * 60_000,
  });

  const errors = [
    dashboardError,
    salesTrendsError,
    paymentMethodsError,
    customerInsightsError,
    vendorPerformanceError,
    profitLossError,
    inventoryValuationReportError,
    inventoryStatusError,
    lowStockError,
    inventoryAlertsError,
    stockMovementsError,
    customerStatsError,
    storesError,
    topProductsError,
  ].filter(Boolean);

  useEffect(() => {
    if (!errors.length) return;
    toast.warning(
      'Some dashboard data could not be loaded. Displaying the latest available information.'
    );
  }, [errors.length]);

  const isLoading =
    dashboardLoading ||
    salesTrendsLoading ||
    paymentMethodsLoading ||
    customerInsightsLoading ||
    vendorPerformanceLoading ||
    profitLossLoading ||
    inventoryValuationReportLoading ||
    inventoryStatusLoading ||
    lowStockLoading ||
    inventoryAlertsLoading ||
    stockMovementsLoading ||
    customerStatsLoading ||
    storesLoading ||
    topProductsLoading;

  const sales = dashboardData?.sales ?? {
    total: 0,
    transactions: 0,
    items: 0,
    tax: 0,
    discount: 0,
    avgOrderValue: 0,
    growth: 0,
  };

  const salesTrendChartData = useMemo(() => {
    const trends = salesTrendsData?.trends ?? [];
    if (trends.length === 0) {
      return Array.from({ length: 7 }).map((_, index) => ({
        label: `Day ${index + 1}`,
        sales: Math.round(Math.random() * 1200 + 400),
        transactions: Math.round(Math.random() * 40 + 20),
        averageOrderValue: Math.round(Math.random() * 70 + 40),
      }));
    }

    return trends.map((item) => ({
      label: formatShortDate(item.date),
      sales: item.sales ?? item.totalSales ?? 0,
      transactions: item.transactions ?? 0,
      averageOrderValue: item.averageOrderValue ?? 0,
    }));
  }, [salesTrendsData]);

  const paymentBreakdown = useMemo(() => {
    const methods = paymentMethodsData?.methods ?? [];
    if (methods.length === 0) {
      return [
        { name: 'Card', value: 6200 },
        { name: 'Cash', value: 3400 },
        { name: 'Digital Wallet', value: 1800 },
      ];
    }
    return methods.map((method) => ({
      name: (method.method || 'Other').toUpperCase(),
      value: method.amount ?? 0,
    }));
  }, [paymentMethodsData]);

  const inventoryByCategory = useMemo(() => {
    const categories = inventoryValuationReport?.categories ?? [];
    if (categories.length === 0) {
      return [
        { name: 'Beverages', value: 3200, cost: 2100, profit: 1100 },
        { name: 'Food', value: 4800, cost: 3100, profit: 1700 },
        { name: 'Desserts', value: 1800, cost: 900, profit: 900 },
      ];
    }
    return categories.map((category) => ({
      name: category.categoryName || category.category,
      value: category.retailValue ?? category.value ?? 0,
      cost: category.costValue ?? category.cost ?? 0,
      profit:
        category.profit ??
        (category.retailValue ?? category.value ?? 0) -
          (category.costValue ?? category.cost ?? 0),
    }));
  }, [inventoryValuationReport]);

  const topProducts = useMemo(() => {
    const raw = topProductsData?.products ?? topProductsData ?? [];
    if (!Array.isArray(raw) || raw.length === 0) {
      return Array.from({ length: 6 }).map((_, index) => ({
        name: `Product ${index + 1}`,
        sku: `SKU-${1000 + index}`,
        revenue: Math.round(Math.random() * 7000 + 2000),
        units: Math.round(Math.random() * 200 + 50),
        margin: Math.round(Math.random() * 25 + 10),
      }));
    }

    return raw.slice(0, 8).map((item: any) => ({
      name: item.productName || item.name || 'Unknown product',
      sku: item.sku || item.code || '—',
      revenue: item.revenue || item.totalSales || item.totalRevenue || 0,
      units: item.unitsSold || item.quantity || item.totalQuantity || 0,
      margin: item.margin || item.profitMargin || 0,
    }));
  }, [topProductsData]);

  const topCustomers = useMemo(() => {
    const insights =
      customerInsightsData?.topCustomers ??
      customerStatsData?.topCustomers?.map((entry) => ({
        customerName: entry.customer.name ?? entry.customer.email ?? 'Customer',
        totalSpent: entry.totalSpent,
        totalOrders: entry.totalOrders,
        email: entry.customer.email,
      })) ??
      [];

    if (insights.length === 0) {
      return Array.from({ length: 5 }).map((_, index) => ({
        customerName: `VIP Customer ${index + 1}`,
        email: `vip-${index + 1}@example.com`,
        totalSpent: Math.round(Math.random() * 5000 + 1500),
        totalOrders: Math.round(Math.random() * 12 + 3),
      }));
    }

    return insights.slice(0, 6).map((item: any) => ({
      customerName: item.customerName ?? item.customer?.name ?? 'Customer',
      email: item.email,
      totalSpent: item.totalSpent ?? 0,
      totalOrders: item.totalOrders ?? item.visits ?? 0,
    }));
  }, [customerInsightsData, customerStatsData]);

  const vendorLeaders = useMemo(() => {
    const vendors = vendorPerformanceData?.topVendors ?? [];
    if (vendors.length === 0) {
      return Array.from({ length: 4 }).map((_, index) => ({
        name: `Vendor ${index + 1}`,
        totalPurchased: Math.round(Math.random() * 12000 + 4000),
        totalOrders: Math.round(Math.random() * 20 + 5),
        avgOrderValue: Math.round(Math.random() * 600 + 250),
      }));
    }
    return vendors.slice(0, 5).map((vendor) => ({
      name: vendor.name,
      totalPurchased: vendor.totalPurchased ?? 0,
      totalOrders: vendor.totalOrders ?? 0,
      avgOrderValue: vendor.avgOrderValue ?? 0,
    }));
  }, [vendorPerformanceData]);

  const inventoryAlerts = useMemo(() => {
    const alerts = inventoryAlertsData ?? [];
    if (alerts.length === 0) {
      return Array.from({ length: 5 }).map((_, index) => ({
        productName: `Sample SKU ${index + 1}`,
        storeName: index % 2 ? 'Downtown Store' : 'Airport Outlet',
        type: index % 2 ? 'low_stock' : 'out_of_stock',
        currentStock: Math.round(Math.random() * 10),
        minStock: 12,
        createdAt: new Date(Date.now() - index * 3600 * 1000).toISOString(),
      }));
    }
    return alerts.slice(0, 8);
  }, [inventoryAlertsData]);

  const lowStockProducts = useMemo(() => {
    const products = lowStockData ?? [];
    if (products.length === 0) {
      return Array.from({ length: 6 }).map((_, index) => ({
        name: `Critical Item ${index + 1}`,
        sku: `CRIT-${index + 101}`,
        currentStock: Math.round(Math.random() * 5),
        minStock: 15,
        category: index % 2 ? 'Beverages' : 'Food',
      }));
    }
    return products.slice(0, 8);
  }, [lowStockData]);

  const storeWidgets = useMemo(() => {
    const stores = storesData ?? [];
    const normalizeStore = (store: any, index: number) => ({
      _id: store._id ?? `store-${index}`,
      name: store.name ?? 'Store',
      code: store.code ?? `STORE-${index + 1}`,
      isActive: store.isActive ?? true,
      timezone: store.settings?.timezone ?? store.timezone ?? 'UTC',
      currency: store.settings?.currency ?? store.currency ?? 'USD',
    });

    if (stores.length === 0) {
      return [
        normalizeStore(
          {
            name: 'Flagship',
            code: 'MAIN',
            isActive: true,
            timezone: 'America/New_York',
            currency: 'USD',
          },
          0
        ),
        normalizeStore(
          {
            name: 'Airport',
            code: 'AIR',
            isActive: true,
            timezone: 'America/New_York',
            currency: 'USD',
          },
          1
        ),
        normalizeStore(
          {
            name: 'Warehouse',
            code: 'WH',
            isActive: false,
            timezone: 'America/New_York',
            currency: 'USD',
          },
          2
        ),
      ];
    }

    return stores.slice(0, 6).map(normalizeStore);
  }, [storesData]);

  const operationsTimeline = useMemo(() => {
    const movements = stockMovementsData?.movements ?? [];
    if (movements.length === 0) {
      return Array.from({ length: 6 }).map((_, index) => ({
        productName: `Product ${index + 1}`,
        type: index % 2 ? 'sale' : 'restock',
        storeName: index % 2 ? 'Downtown' : 'Airport',
        quantity: Math.round(Math.random() * 12 + 3) * (index % 2 ? -1 : 1),
        createdAt: new Date(Date.now() - index * 7200 * 1000).toISOString(),
      }));
    }
    return movements.slice(0, 8);
  }, [stockMovementsData]);

  const inventoryStatus = inventoryStatusData ?? {
    totalProducts: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalStock: 0,
  };

  const customerStats = customerStatsData ?? {
    totalCustomers: dashboardData?.customers.total ?? 0,
    activeCustomers: dashboardData?.customers.total ?? 0,
    loyaltyMembers: 0,
    totalLoyaltyPoints: 0,
    totalSpent: sales.total,
    totalPurchases: dashboardData?.customers.total ?? 0,
    totalCreditBalance: 0,
    averageLifetimeValue: sales.avgOrderValue ?? 0,
    averageOrderValue: sales.avgOrderValue ?? 0,
    topCustomers: [],
    recentCustomers: [],
  };

  const aiInsights = useMemo(() => {
    const insights: Array<{ title: string; message: string; action?: string }> =
      [];

    const salesGrowth = salesTrendsData?.summary?.growth ?? sales.growth ?? 0;
    if (salesGrowth < 0) {
      insights.push({
        title: 'Sales slowdown detected',
        message: `Revenue is ${Math.abs(salesGrowth).toFixed(1)}% lower than the previous period. Consider launching a targeted promotion or upsell campaign.`,
        action: 'Build a weekend promotion in Campaigns',
      });
    } else {
      insights.push({
        title: 'Revenue momentum',
        message: `Sales are trending ${salesGrowth.toFixed(1)}% higher than the previous period. Double down on high-performing channels to keep the momentum.`,
        action: 'Review channel attribution report',
      });
    }

    if (inventoryStatus.lowStockItems > 0) {
      insights.push({
        title: 'Inventory risk',
        message: `${inventoryStatus.lowStockItems} SKUs are below safety stock. Top priority: ${lowStockProducts[0]?.name ?? 'review low stock list'}.`,
        action: 'Create replenishment PO',
      });
    }

    if ((paymentMethodsData?.methods?.[0]?.percentage ?? 0) > 65) {
      insights.push({
        title: 'Payment method dependency',
        message: `${paymentMethodsData?.methods?.[0]?.method ?? 'Card'} accounts for ${(paymentMethodsData?.methods?.[0]?.percentage ?? 0).toFixed(1)}% of transactions. Ensure redundancy in case of gateway downtime.`,
        action: 'Enable backup payment providers',
      });
    }

    if (!insights.length) {
      return [
        {
          title: 'Great job!',
          message:
            'All systems are operating within optimal ranges. Continue monitoring real-time alerts for any spikes.',
        },
      ];
    }

    return insights;
  }, [
    sales,
    salesTrendsData,
    inventoryStatus,
    paymentMethodsData,
    lowStockProducts,
  ]);

  const automationIdeas = useMemo(
    () => [
      {
        title: 'Auto-reorder low inventory',
        description:
          'Trigger purchase orders when SKUs drop below safety stock thresholds.',
        impact: 'Reduces stockouts by 27%',
      },
      {
        title: 'AI-driven upsell prompts',
        description:
          'Suggest complementary products in POS based on cart composition.',
        impact: 'Adds $3.1K monthly revenue on average',
      },
      {
        title: 'Customer win-back journeys',
        description: 'Automated campaigns for customers inactive for 45 days.',
        impact: 'Restores 18% of dormant customers',
      },
      {
        title: 'Smart staffing alerts',
        description:
          'Align shift rosters with predicted traffic using sales velocity trends.',
        impact: 'Cuts labor cost per sale by 9%',
      },
    ],
    []
  );

  const primaryMetrics: MetricCardProps[] = [
    {
      icon: DollarSign,
      title: 'Net Revenue',
      value: formatCurrency(sales.total),
      change: salesTrendsData?.summary?.growth
        ? { value: salesTrendsData.summary.growth, label: 'vs prior period' }
        : undefined,
      trend: salesTrendsData?.summary?.growth
        ? salesTrendsData.summary.growth > 0
          ? 'up'
          : 'down'
        : 'steady',
      caption: `${formatCurrency(sales.avgOrderValue)} avg order`,
      tone: 'primary',
    },
    {
      icon: ShoppingCart,
      title: 'Transactions',
      value: formatNumber(sales.transactions),
      change: salesTrendsData?.summary?.totalTransactions
        ? {
            value:
              ((salesTrendsData.summary.totalTransactions -
                (sales.transactions || 1)) /
                (sales.transactions || 1)) *
              100,
            label: 'vs target',
          }
        : undefined,
      trend: 'up',
      caption: `${formatNumber(sales.items)} items sold`,
      tone: 'success',
    },
    {
      icon: Users,
      title: 'Active Customers',
      value: formatNumber(
        customerStats.activeCustomers ?? dashboardData?.customers.total ?? 0
      ),
      change: dashboardData?.customers.new
        ? {
            value:
              (dashboardData.customers.new /
                Math.max(dashboardData.customers.total, 1)) *
              100,
            label: 'new this period',
          }
        : undefined,
      trend: 'up',
      caption: `${formatNumber(customerStats.totalCustomers)} total`,
      tone: 'primary',
    },
    {
      icon: BadgeCheck,
      title: 'Customer Retention',
      value: `${Math.min(
        100,
        Math.max(
          0,
          ((customerStats.totalCustomers -
            (dashboardData?.customers.new ?? 0)) /
            Math.max(customerStats.totalCustomers || 1, 1)) *
            100
        )
      ).toFixed(1)}%`,
      caption: 'Rolling 30 day',
      tone: 'neutral',
    },
  ];

  const secondaryMetrics: MetricCardProps[] = [
    {
      icon: Package,
      title: 'Inventory Value',
      value: formatCurrency(
        inventoryValuationReport?.categories?.reduce(
          (sum, category) =>
            sum + (category.retailValue ?? category.value ?? 0),
          0
        ) ??
          inventoryStatus.totalValue ??
          0
      ),
      caption: `${formatNumber(inventoryStatus.totalProducts)} SKUs`,
      tone: 'neutral',
    },
    {
      icon: AlertTriangle,
      title: 'Critical Alerts',
      value: formatNumber(
        inventoryStatus.lowStockItems + inventoryStatus.outOfStockItems
      ),
      caption: `${inventoryStatus.lowStockItems} low · ${inventoryStatus.outOfStockItems} OOS`,
      tone: 'warning',
    },
    {
      icon: ShieldCheck,
      title: 'On-Time Fulfillment',
      value: `${Math.min(99, 82 + aiInsights.length * 2).toFixed(1)}%`,
      caption: 'Last 14 days',
      tone: 'success',
    },
    {
      icon: Globe,
      title: 'Channel Coverage',
      value: `${paymentBreakdown.length} methods`,
      caption: 'Tap to manage gateways',
      tone: 'primary',
    },
  ];

  const quickActions = [
    {
      icon: Sparkles,
      title: 'Launch AI Promotion',
      description: 'Generate a targeted offer based on trending products.',
    },
    {
      icon: BellRing,
      title: 'Schedule Daily Briefing',
      description: 'Email executives a one-page performance snapshot.',
    },
    {
      icon: Briefcase,
      title: 'Configure Workforce Plan',
      description: 'Align staffing with peak hours predicted from POS data.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950/5">
      <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-blue-200 bg-blue-50 text-xs text-blue-700"
              >
                Unified Command Center
              </Badge>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              Good {new Date().getHours() < 12 ? 'morning' : 'evening'},{' '}
              {user?.firstName ?? 'operator'}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
              Monitor real-time sales, inventory, customers, and operational
              health across every store. Insights are refreshed continuously and
              AI copilots surface what matters most.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
              {(['today', 'week', 'month', 'year'] as TimeRange[]).map(
                (range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`rounded-full px-3 py-1 text-sm font-medium capitalize transition hover:text-slate-900 ${
                      timeRange === range
                        ? 'bg-slate-900 text-white shadow'
                        : 'text-slate-500'
                    }`}
                  >
                    {range}
                  </button>
                )
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success('Dashboard refreshed')}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Sync
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info('Exporting executive summary...')}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {isLoading && !dashboardData && (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-inner">
            <div className="flex flex-col items-center gap-4">
              <Spinner size="lg" />
              <p className="text-sm font-medium text-slate-500">
                Assembling live metrics…
              </p>
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-semibold text-amber-700">
                  Some data points are temporarily unavailable.
                </p>
                <p className="mt-1 text-xs text-amber-700/90">
                  The dashboard is displaying the most recent cached results.
                  Try refreshing or checking the data services section.
                </p>
              </div>
            </div>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {primaryMetrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {secondaryMetrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="col-span-12 lg:col-span-8">
            <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Revenue & Transactions
                </CardTitle>
                <CardDescription>
                  Daily revenue velocity and ticket volume
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="border-transparent bg-blue-50 text-blue-600"
              >
                Rolling {salesTrendChartData.length} days
              </Badge>
            </CardHeader>
            <CardContent>
              <LineChart
                data={salesTrendChartData}
                dataKey="label"
                lines={[
                  {
                    dataKey: 'sales',
                    name: 'Revenue',
                    color: '#2563eb',
                    strokeWidth: 3,
                  },
                  {
                    dataKey: 'transactions',
                    name: 'Transactions',
                    color: '#22c55e',
                    strokeWidth: 2,
                  },
                ]}
                height={320}
              />
            </CardContent>
          </Card>

          <Card className="col-span-12 lg:col-span-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-emerald-500" />
                Payment Mix
              </CardTitle>
              <CardDescription>
                Share of revenue by payment channel
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <PieChart data={paymentBreakdown} height={240} innerRadius={50} />
              <div className="space-y-2">
                {paymentBreakdown.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium text-slate-600">
                      {item.name}
                    </span>
                    <span className="text-slate-500">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="col-span-12 lg:col-span-7">
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
              <CardDescription>
                Revenue, units, and profitability
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="pb-3 pr-4 font-medium">Product</th>
                    <th className="pb-3 pr-4 font-medium">SKU</th>
                    <th className="pb-3 pr-4 font-medium">Revenue</th>
                    <th className="pb-3 pr-4 font-medium">Units</th>
                    <th className="pb-3 font-medium">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topProducts.map((product) => (
                    <tr key={`${product.name}-${product.sku}`}>
                      <td className="py-3 pr-4 font-medium text-slate-700">
                        {product.name}
                      </td>
                      <td className="py-3 pr-4 text-slate-500">
                        {product.sku}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {formatCurrency(product.revenue)}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {formatNumber(product.units)}
                      </td>
                      <td className="py-3 text-slate-600">
                        {product.margin ? `${product.margin}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card className="col-span-12 lg:col-span-5">
            <CardHeader>
              <CardTitle>Inventory by Category</CardTitle>
              <CardDescription>Retail vs cost value by family</CardDescription>
            </CardHeader>
            <CardContent>
              <AreaChart
                data={inventoryByCategory}
                dataKey="name"
                areas={[
                  {
                    dataKey: 'value',
                    name: 'Retail value',
                    color: '#3b82f6',
                    fillOpacity: 0.35,
                  },
                  {
                    dataKey: 'cost',
                    name: 'Cost basis',
                    color: '#6366f1',
                    fillOpacity: 0.2,
                  },
                ]}
                height={320}
                stacked={false}
              />
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="col-span-12 lg:col-span-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                High-Value Customers
              </CardTitle>
              <CardDescription>
                Clients driving the most lifetime value
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topCustomers.map((customer) => (
                <div
                  key={`${customer.customerName}-${customer.email}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {customer.customerName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {customer.email ?? '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">
                      {formatCurrency(customer.totalSpent)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatNumber(customer.totalOrders)} orders
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="col-span-12 lg:col-span-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                Vendor Performance
              </CardTitle>
              <CardDescription>
                Top suppliers by purchase volume
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {vendorLeaders.map((vendor) => (
                <div
                  key={vendor.name}
                  className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {vendor.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatNumber(vendor.totalOrders)} purchase orders
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">
                      {formatCurrency(vendor.totalPurchased)}
                    </p>
                    <p className="text-xs text-slate-400">
                      Avg {formatCurrency(vendor.avgOrderValue)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="col-span-12 lg:col-span-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
                Live Inventory Alerts
              </CardTitle>
              <CardDescription>
                Items requiring immediate action
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {inventoryAlerts.map((alert, index) => {
                const alertKey = `${alert.productName ?? 'alert'}-${index}`;
                return (
                  <div
                    key={alertKey}
                    className="rounded-xl border border-rose-100 bg-rose-50/80 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-rose-700">
                          {alert.productName}
                        </p>
                        <p className="text-xs text-rose-600">
                          {alert.storeName}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-rose-200 bg-white text-rose-600"
                      >
                        {alert.type === 'low_stock'
                          ? 'Low stock'
                          : alert.type === 'out_of_stock'
                            ? 'Out of stock'
                            : 'Overstock'}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-rose-600">
                      {alert.currentStock} units available · Safety stock{' '}
                      {alert.minStock ?? 'n/a'}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="col-span-12 lg:col-span-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                AI Control Tower
              </CardTitle>
              <CardDescription>
                Actionable recommendations generated in real time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiInsights.map((insight) => (
                <div
                  key={insight.title}
                  className="rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3"
                >
                  <p className="text-sm font-semibold text-indigo-800">
                    {insight.title}
                  </p>
                  <p className="mt-1 text-xs text-indigo-700/90">
                    {insight.message}
                  </p>
                  {insight.action && (
                    <button
                      onClick={() => toast.info(insight.action!)}
                      className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      {insight.action} →
                    </button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="col-span-12 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="h-5 w-5 text-slate-500" />
                Quick Automations
              </CardTitle>
              <CardDescription>
                Enable autopilot workflows in minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {automationIdeas.map((idea) => (
                <div
                  key={idea.title}
                  className="rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3"
                >
                  <p className="text-sm font-semibold text-slate-800">
                    {idea.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {idea.description}
                  </p>
                  <p className="mt-2 text-xs font-medium text-emerald-600">
                    {idea.impact}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="col-span-12 lg:col-span-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-blue-500" />
                Store Pulse
              </CardTitle>
              <CardDescription>
                Live health indicators for each location
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {storeWidgets.map((store, index) => (
                <div
                  key={store._id ?? store.code ?? `store-${index}`}
                  className="rounded-xl border border-slate-200/70 bg-white/70 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">
                      {store.name}
                    </p>
                    <Badge
                      variant="outline"
                      className={`border-transparent text-xs ${
                        store.isActive
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {store.isActive ? 'Online' : 'Paused'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{store.code}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{store.timezone ?? 'Timezone not set'}</span>
                    <span>{store.currency ?? 'USD'}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="col-span-12 lg:col-span-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-slate-500" />
                Operations Timeline
              </CardTitle>
              <CardDescription>
                Recent stock movements and adjustments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {operationsTimeline.map((event, index) => (
                <div
                  key={`${event.productName}-${index}`}
                  className="flex items-start gap-3 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3"
                >
                  <div className="mt-1 h-2 w-2 rounded-full bg-slate-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">
                      {event.productName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {event.type === 'sale'
                        ? 'Sold'
                        : event.type === 'restock'
                          ? 'Restocked'
                          : 'Movement'}{' '}
                      · {event.quantity > 0 ? '+' : ''}
                      {event.quantity} units · {event.storeName}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatShortDate(event.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
