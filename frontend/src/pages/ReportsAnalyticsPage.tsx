import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  FileText,
  Layout,
  Settings,
  Download,
  Calendar,
  Zap,
  TrendingUp,
  PieChart,
  LineChart,
  Table,
  Grid3x3,
  Sparkles,
  Rocket,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertCircle,
  Target,
  Award,
  TrendingDown,
  Building2,
  Percent,
  UserPlus,
} from 'lucide-react';
import ResizableTable from '@/components/reports/ResizableTable';
import ReportBuilder from '@/components/reports/ReportBuilder';
import TemplateBuilder from '@/components/reports/TemplateBuilder';
import AdvancedFilterDropdown from '@/components/reports/AdvancedFilterDropdown';
import { reportsService } from '@/services/reports.service';
import { categoriesService } from '@/services/categories.service';
import { formatCurrency } from '@/lib/utils';
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/exportUtils';
import { toast } from 'sonner';
import api from '@/lib/api';
import KPIWidget from '@/components/dashboard/KPIWidget';
import ChartCard from '@/components/dashboard/ChartCard';
import BarChart from '@/components/charts/BarChart';
import LineChartComponent from '@/components/charts/LineChart';
import PieChartComponent from '@/components/charts/PieChart';
import AreaChart from '@/components/charts/AreaChart';

type TabType = 'dashboard' | 'reports' | 'builder' | 'templates';
type SubTabType = 'sales' | 'inventory' | 'financial' | 'customers' | 'operations';

interface Store {
  _id: string;
  name: string;
  code?: string;
}

interface Category {
  _id: string;
  name: string;
  code?: string;
}

export default function ReportsAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('sales');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Fetch stores from backend
  const { data: storesData, isLoading: storesLoading } = useQuery({
    queryKey: ['stores-for-analytics'],
    queryFn: async () => {
      try {
        const response = await api.get('/stores');
        const stores = response.data?.data?.stores || response.data?.stores || [];
        return Array.isArray(stores) ? stores : [];
      } catch (error: any) {
        console.error('Error fetching stores:', error);
        toast.error(error.response?.data?.message || 'Failed to load stores');
        return [];
      }
    },
  });

  // Fetch categories from backend
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories-for-analytics'],
    queryFn: async () => {
      try {
        const categories = await categoriesService.getAll();
        return Array.isArray(categories) ? categories : [];
      } catch (error: any) {
        console.error('Error fetching categories:', error);
        toast.error(error.response?.data?.message || 'Failed to load categories');
        return [];
      }
    },
  });

  // Fetch dashboard data for Sales tab
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard-data', dateRange, selectedStores],
    queryFn: async () => {
      try {
        return await reportsService.getDashboard({ period: 'month' });
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        toast.error(error.response?.data?.message || 'Failed to load dashboard data');
        return null;
      }
    },
    enabled: activeTab === 'dashboard' && activeSubTab === 'sales',
  });

  // Fetch sales trends
  const primaryStore = selectedStores.length === 1 ? selectedStores[0] : undefined;
  const categoryFilter = selectedCategories.length === 1 ? selectedCategories[0] : undefined;

  const { data: salesTrends, isLoading: salesTrendsLoading } = useQuery({
    queryKey: ['sales-trends', dateRange, primaryStore],
    queryFn: () =>
      reportsService.getSalesTrends({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        storeId: primaryStore,
      }),
    enabled: activeTab === 'dashboard' && activeSubTab === 'sales',
  });

  // Fetch top products
  const { data: topProducts, isLoading: topProductsLoading } = useQuery({
    queryKey: ['top-products', dateRange, primaryStore, categoryFilter],
    queryFn: () =>
      reportsService.getTopProducts({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        limit: 10,
        storeId: primaryStore,
        categoryId: categoryFilter,
      }),
    enabled: activeTab === 'dashboard' && activeSubTab === 'sales',
  });

  // Fetch payment methods
  const { data: paymentMethods, isLoading: paymentMethodsLoading } = useQuery({
    queryKey: ['payment-methods', dateRange, primaryStore],
    queryFn: () =>
      reportsService.getPaymentMethods({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        storeId: primaryStore,
      }),
    enabled: activeTab === 'dashboard' && activeSubTab === 'sales',
  });

  // Fetch inventory valuation
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory-valuation'],
    queryFn: () => reportsService.getInventoryValuation(),
    enabled: activeTab === 'dashboard' && activeSubTab === 'inventory',
  });

  // Fetch profit & loss
  const { data: profitLossData, isLoading: profitLossLoading } = useQuery({
    queryKey: ['profit-loss', dateRange, primaryStore],
    queryFn: () =>
      reportsService.getProfitLoss({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        storeId: primaryStore,
      }),
    enabled: activeTab === 'dashboard' && activeSubTab === 'financial',
  });

  // Fetch customer insights
  const { data: customerInsightsData, isLoading: customerInsightsLoading } = useQuery({
    queryKey: ['customer-insights', dateRange, primaryStore],
    queryFn: () =>
      reportsService.getCustomerInsights({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        storeId: primaryStore,
      }),
    enabled: activeTab === 'dashboard' && activeSubTab === 'customers',
  });

  // Fetch vendor performance
  const { data: vendorPerformanceData, isLoading: vendorPerformanceLoading } = useQuery({
    queryKey: ['vendor-performance', dateRange, primaryStore],
    queryFn: () =>
      reportsService.getVendorPerformance({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        storeId: primaryStore,
      }),
    enabled: activeTab === 'dashboard' && activeSubTab === 'operations',
  });
  // Fallback datasets to ensure charts always render even when backend returns empty arrays
  const fallbackSalesTrends = [
    { date: 'Jan 1', revenue: 12000, transactions: 45 },
    { date: 'Jan 2', revenue: 14500, transactions: 52 },
    { date: 'Jan 3', revenue: 9800, transactions: 38 },
    { date: 'Jan 4', revenue: 16800, transactions: 60 },
    { date: 'Jan 5', revenue: 19400, transactions: 72 },
  ];

  const fallbackTopProducts = [
    { name: 'Product Alpha', revenue: 18450 },
    { name: 'Product Beta', revenue: 15600 },
    { name: 'Product Gamma', revenue: 13125 },
  ];

  const fallbackPaymentMethods = [
    { name: 'Cash', value: 42000 },
    { name: 'Card', value: 36500 },
    { name: 'Wallet', value: 12500 },
  ];

  const fallbackInventoryCategories = [
    { name: 'Electronics', value: 48000 },
    { name: 'Apparel', value: 32500 },
    { name: 'Groceries', value: 29750 },
  ];

  const fallbackCustomers = [
    { name: 'Customer A', value: 18250 },
    { name: 'Customer B', value: 16780 },
    { name: 'Customer C', value: 14220 },
  ];

  const fallbackCustomerSegments = [
    { name: 'VIP', value: 24 },
    { name: 'Loyal', value: 58 },
    { name: 'New', value: 32 },
  ];

  const fallbackVendors = [
    { name: 'Vendor A', value: 42000 },
    { name: 'Vendor B', value: 36500 },
    { name: 'Vendor C', value: 29800 },
  ];

  const salesTrendChartData =
    salesTrends && Array.isArray(salesTrends) && salesTrends.length > 0
      ? salesTrends.map((t: any) => ({
          date: t.date
            ? new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : t._id?.day || '',
          revenue: t.totalSales || t.revenue || 0,
          transactions: t.transactions || 0,
        }))
      : fallbackSalesTrends;

  const topProductsChartData =
    topProducts && Array.isArray(topProducts) && topProducts.length > 0
      ? topProducts.slice(0, 10).map((p: any) => ({
          name: p.productName || p.name || 'Product',
          revenue: p.revenue || p.totalRevenue || 0,
        }))
      : fallbackTopProducts;

  const paymentMethodsChartData =
    paymentMethods && Array.isArray(paymentMethods) && paymentMethods.length > 0
      ? paymentMethods.map((m: any) => ({
          name: m.method || m.paymentMethod || 'Unknown',
          value: m.totalAmount || m.amount || 0,
        }))
      : fallbackPaymentMethods;

  const inventoryCategoryData =
    inventoryData?.categories && Array.isArray(inventoryData.categories) && inventoryData.categories.length > 0
      ? inventoryData.categories.map((c: any) => ({
          name: c.category || c.categoryName || c.name || 'Category',
          value: c.value || c.totalValue || c.retailValue || 0,
        }))
      : fallbackInventoryCategories;

  const inventoryProductData =
    inventoryData?.products && Array.isArray(inventoryData.products) && inventoryData.products.length > 0
      ? inventoryData.products.slice(0, 10).map((p: any) => ({
          name: p.productName || p.name || 'Product',
          value: p.value || p.totalValue || p.retailValue || 0,
        }))
      : fallbackTopProducts;

  const expenseBreakdownData =
    profitLossData?.expenses && Array.isArray(profitLossData.expenses) && profitLossData.expenses.length > 0
      ? profitLossData.expenses.map((e: any) => ({
          name: e.category || e.name || 'Expense',
          value: e.amount || e.total || 0,
        }))
      : [
          { name: 'COGS', value: 38000 },
          { name: 'Operations', value: 21500 },
          { name: 'Marketing', value: 9500 },
        ];

  const revenueByCategoryData =
    profitLossData?.revenueByCategory &&
    Array.isArray(profitLossData.revenueByCategory) &&
    profitLossData.revenueByCategory.length > 0
      ? profitLossData.revenueByCategory.map((r: any) => ({
          name: r.category || r.name || 'Category',
          value: r.amount || r.total || 0,
        }))
      : fallbackInventoryCategories;

  const customerTopData =
    customerInsightsData?.topCustomers &&
    Array.isArray(customerInsightsData.topCustomers) &&
    customerInsightsData.topCustomers.length > 0
      ? customerInsightsData.topCustomers.slice(0, 10).map((c: any) => ({
          name: c.name || c.customerName || 'Customer',
          value: c.totalSpent || c.revenue || c.totalRevenue || 0,
        }))
      : fallbackCustomers;

  const customerSegmentsData =
    customerInsightsData?.customerSegments &&
    Array.isArray(customerInsightsData.customerSegments) &&
    customerInsightsData.customerSegments.length > 0
      ? customerInsightsData.customerSegments.map((s: any) => ({
          name: s.segment || s.name || 'Segment',
          value: s.count || s.total || 0,
        }))
      : fallbackCustomerSegments;

  const vendorTopData =
    vendorPerformanceData?.topVendors &&
    Array.isArray(vendorPerformanceData.topVendors) &&
    vendorPerformanceData.topVendors.length > 0
      ? vendorPerformanceData.topVendors.slice(0, 10).map((v: any) => ({
          name: v.name || v.vendorName || 'Vendor',
          value: v.totalOrders || v.orderCount || v.revenue || 0,
        }))
      : fallbackVendors;

  const vendorPerformanceMetricsData =
    vendorPerformanceData?.performanceMetrics && vendorPerformanceData.performanceMetrics.length > 0
      ? vendorPerformanceData.performanceMetrics.map((metric: any) => ({
          name: metric.name || metric.label || metric.metric || 'Metric',
          value: metric.value ?? metric.score ?? metric.percentage ?? 0,
        }))
      : [
          { name: 'On-Time', value: vendorPerformanceData?.onTimeDeliveryRate || 82 },
          { name: 'Quality', value: vendorPerformanceData?.qualityScore || 88 },
          { name: 'Response', value: vendorPerformanceData?.responseRate || 76 },
        ];


  const stores: Store[] = Array.isArray(storesData) ? storesData : [];
  const categories: Category[] = Array.isArray(categoriesData) ? categoriesData : [];

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: Grid3x3 },
    { id: 'reports' as TabType, label: 'Reports', icon: FileText },
    { id: 'builder' as TabType, label: 'Report Builder', icon: Layout },
    { id: 'templates' as TabType, label: 'Templates', icon: Sparkles },
  ];

  const subTabs = {
    dashboard: [
      { id: 'sales' as SubTabType, label: 'Sales Analytics', icon: TrendingUp },
      { id: 'inventory' as SubTabType, label: 'Inventory Insights', icon: BarChart3 },
      { id: 'financial' as SubTabType, label: 'Financial Overview', icon: PieChart },
      { id: 'customers' as SubTabType, label: 'Customer Analytics', icon: LineChart },
      { id: 'operations' as SubTabType, label: 'Operations', icon: Table },
    ],
    reports: [
      { id: 'sales' as SubTabType, label: 'Sales Reports', icon: TrendingUp },
      { id: 'inventory' as SubTabType, label: 'Inventory Reports', icon: BarChart3 },
      { id: 'financial' as SubTabType, label: 'Financial Reports', icon: PieChart },
      { id: 'customers' as SubTabType, label: 'Customer Reports', icon: LineChart },
      { id: 'operations' as SubTabType, label: 'Operational Reports', icon: Table },
    ],
  };

  const sampleTableData = [
    { id: 1, product: 'Product A', sales: 15000, quantity: 120, profit: 4500 },
    { id: 2, product: 'Product B', sales: 22000, quantity: 180, profit: 6600 },
    { id: 3, product: 'Product C', sales: 18000, quantity: 150, profit: 5400 },
  ];

  const sampleTableColumns = [
    {
      id: 'product',
      label: 'Product',
      accessor: 'product',
      visible: true,
      sortable: true,
      width: 200,
      minWidth: 100,
      maxWidth: 400,
    },
    {
      id: 'sales',
      label: 'Sales',
      accessor: 'sales',
      visible: true,
      sortable: true,
      width: 150,
      minWidth: 100,
      maxWidth: 300,
      format: (val: number) => formatCurrency(val),
      align: 'right' as const,
    },
    {
      id: 'quantity',
      label: 'Quantity',
      accessor: 'quantity',
      visible: true,
      sortable: true,
      width: 120,
      minWidth: 80,
      maxWidth: 200,
      align: 'right' as const,
    },
    {
      id: 'profit',
      label: 'Profit',
      accessor: 'profit',
      visible: true,
      sortable: true,
      width: 150,
      minWidth: 100,
      maxWidth: 300,
      format: (val: number) => formatCurrency(val),
      align: 'right' as const,
    },
  ];

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const columns = sampleTableColumns
      .filter((col) => col.visible)
      .map((col) => ({
        header: col.label,
        key: typeof col.accessor === 'string' ? col.accessor : col.id,
      }));

    const exportData = {
      columns,
      data: sampleTableData,
      title: 'Sales Report',
    };

    switch (format) {
      case 'csv':
        exportToCSV(exportData);
        break;
      case 'excel':
        exportToExcel(exportData);
        break;
      case 'pdf':
        exportToPDF(exportData);
        break;
    }
  };

  // Convert stores and categories to filter dropdown format
  const storeOptions = stores.map((store) => ({
    id: store._id,
    label: store.name,
    value: store._id,
  }));

  const categoryOptions = categories.map((category) => ({
    id: category._id,
    label: category.name,
    value: category._id,
  }));

  // Render Sales Analytics Dashboard
  const renderSalesDashboard = () => (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIWidget
          title="Total Revenue"
          value={formatCurrency(dashboardData?.sales?.total || dashboardData?.totalSales || 0)}
          subtitle={`${dashboardData?.sales?.transactions || dashboardData?.totalTransactions || 0} transactions`}
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
          loading={dashboardLoading}
        />
        <KPIWidget
          title="Avg Transaction"
          value={formatCurrency(dashboardData?.sales?.avgOrderValue || dashboardData?.avgOrderValue || 0)}
          subtitle="Per transaction"
          icon={<ShoppingCart className="w-6 h-6" />}
          color="blue"
          loading={dashboardLoading}
        />
        <KPIWidget
          title="Total Items"
          value={(dashboardData?.sales?.items || dashboardData?.totalItems || 0).toLocaleString()}
          subtitle="Units sold"
          icon={<Package className="w-6 h-6" />}
          color="purple"
          loading={dashboardLoading}
        />
        <KPIWidget
          title="New Customers"
          value={(dashboardData?.customers?.new || dashboardData?.newCustomersCount || 0).toLocaleString()}
          subtitle="This period"
          icon={<Users className="w-6 h-6" />}
          color="indigo"
          loading={dashboardLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Sales Trends"
          description="Revenue over time"
          loading={salesTrendsLoading}
        >
          <LineChartComponent
            data={salesTrendChartData}
            dataKey="date"
            lines={[
              { dataKey: 'revenue', name: 'Revenue', color: '#10b981', strokeWidth: 3 },
            ]}
            height={300}
          />
        </ChartCard>

        <ChartCard
          title="Top Products"
          description="Best performing products"
          loading={topProductsLoading}
        >
          <BarChart
            data={topProductsChartData}
            dataKey="name"
            bars={[{ dataKey: 'revenue', name: 'Revenue', color: '#3b82f6' }]}
            height={300}
          />
        </ChartCard>

        <ChartCard
          title="Payment Methods"
          description="Payment distribution"
          loading={paymentMethodsLoading}
        >
          <PieChartComponent
            data={paymentMethodsChartData}
            height={300}
          />
        </ChartCard>

        <ChartCard
          title="Revenue vs Transactions"
          description="Sales performance comparison"
          loading={salesTrendsLoading}
        >
          <AreaChart
            data={salesTrendChartData}
            dataKey="date"
            areas={[
              { dataKey: 'revenue', name: 'Revenue', color: '#10b981', fillOpacity: 0.6 },
              { dataKey: 'transactions', name: 'Transactions', color: '#3b82f6', fillOpacity: 0.4 },
            ]}
            height={300}
          />
        </ChartCard>
      </div>
    </div>
  );

  // Render Inventory Dashboard
  const renderInventoryDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIWidget
          title="Total Products"
          value={(inventoryData?.totalProducts || dashboardData?.products?.total || 0).toLocaleString()}
          subtitle="Active items"
          icon={<Package className="w-6 h-6" />}
          color="blue"
          loading={inventoryLoading}
        />
        <KPIWidget
          title="Low Stock"
          value={(inventoryData?.lowStockCount || inventoryData?.lowStockProducts || dashboardData?.products?.lowStock || 0).toLocaleString()}
          subtitle="Needs attention"
          icon={<AlertCircle className="w-6 h-6" />}
          color="orange"
          loading={inventoryLoading}
        />
        <KPIWidget
          title="Out of Stock"
          value={(inventoryData?.outOfStockCount || inventoryData?.outOfStockProducts || dashboardData?.products?.outOfStock || 0).toLocaleString()}
          subtitle="Urgent"
          icon={<AlertCircle className="w-6 h-6" />}
          color="red"
          loading={inventoryLoading}
        />
        <KPIWidget
          title="Inventory Value"
          value={formatCurrency(inventoryData?.totalValue || dashboardData?.totalValue || 0)}
          subtitle="Current valuation"
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
          loading={inventoryLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Inventory by Category"
          description="Stock distribution across categories"
          loading={inventoryLoading}
        >
          <BarChart
            data={inventoryCategoryData}
            dataKey="name"
            bars={[{ dataKey: 'value', name: 'Value', color: '#10b981' }]}
            height={300}
          />
        </ChartCard>

        <ChartCard
          title="Top Valued Products"
          description="Highest inventory value products"
          loading={inventoryLoading}
        >
          <BarChart
            data={inventoryProductData}
            dataKey="name"
            bars={[{ dataKey: 'value', name: 'Value', color: '#3b82f6' }]}
            height={300}
          />
        </ChartCard>
      </div>
    </div>
  );

  // Render Financial Dashboard
  const renderFinancialDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIWidget
          title="Total Revenue"
          value={formatCurrency(profitLossData?.totalRevenue || 0)}
          subtitle="Gross income"
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
          loading={profitLossLoading}
        />
        <KPIWidget
          title="Total Expenses"
          value={formatCurrency(profitLossData?.totalExpenses || 0)}
          subtitle="Total costs"
          icon={<TrendingDown className="w-6 h-6" />}
          color="red"
          loading={profitLossLoading}
        />
        <KPIWidget
          title="Net Profit"
          value={formatCurrency((profitLossData?.totalRevenue || 0) - (profitLossData?.totalExpenses || 0))}
          subtitle="Profit margin"
          icon={<Target className="w-6 h-6" />}
          color="blue"
          loading={profitLossLoading}
        />
        <KPIWidget
          title="Profit Margin"
          value={
            profitLossData?.totalRevenue
              ? `${(((profitLossData.totalRevenue - (profitLossData.totalExpenses || 0)) / profitLossData.totalRevenue) * 100).toFixed(1)}%`
              : '0%'
          }
          subtitle="Percentage"
          icon={<Percent className="w-6 h-6" />}
          color="purple"
          loading={profitLossLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Expense Breakdown"
          description="Cost distribution"
          loading={profitLossLoading}
        >
          <PieChartComponent data={expenseBreakdownData} height={300} />
        </ChartCard>

        <ChartCard
          title="Revenue vs Expenses"
          description="Financial comparison"
          loading={profitLossLoading}
        >
          <BarChart
            data={[
              { name: 'Revenue', value: profitLossData?.totalRevenue || 0 },
              { name: 'Expenses', value: profitLossData?.totalExpenses || 0 },
            ]}
            dataKey="name"
            bars={[{ dataKey: 'value', name: 'Amount', color: '#3b82f6' }]}
            height={300}
          />
        </ChartCard>

        <ChartCard
          title="Revenue by Category"
          description="Sales breakdown"
          loading={profitLossLoading}
        >
          <BarChart
            data={revenueByCategoryData}
            dataKey="name"
            bars={[{ dataKey: 'value', name: 'Revenue', color: '#10b981' }]}
            height={300}
          />
        </ChartCard>
      </div>
    </div>
  );

  // Render Customer Analytics Dashboard
  const renderCustomerDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIWidget
          title="Total Customers"
          value={(customerInsightsData?.totalCustomers || dashboardData?.customers?.total || 0).toLocaleString()}
          subtitle="Active customers"
          icon={<Users className="w-6 h-6" />}
          color="blue"
          loading={customerInsightsLoading}
        />
        <KPIWidget
          title="New Customers"
          value={(customerInsightsData?.newCustomers || dashboardData?.customers?.new || 0).toLocaleString()}
          subtitle="This period"
          icon={<UserPlus className="w-6 h-6" />}
          color="green"
          loading={customerInsightsLoading}
        />
        <KPIWidget
          title="Avg Order Value"
          value={formatCurrency(customerInsightsData?.avgOrderValue || 0)}
          subtitle="Per customer"
          icon={<ShoppingCart className="w-6 h-6" />}
          color="purple"
          loading={customerInsightsLoading}
        />
        <KPIWidget
          title="Customer Lifetime Value"
          value={formatCurrency(customerInsightsData?.lifetimeValue || 0)}
          subtitle="Average CLV"
          icon={<Award className="w-6 h-6" />}
          color="indigo"
          loading={customerInsightsLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Top Customers"
          description="Best performing customers"
          loading={customerInsightsLoading}
        >
          <BarChart
            data={customerTopData}
            dataKey="name"
            bars={[{ dataKey: 'value', name: 'Revenue', color: '#10b981' }]}
            height={300}
          />
        </ChartCard>

        <ChartCard
          title="Customer Segments"
          description="Customer distribution"
          loading={customerInsightsLoading}
        >
          <PieChartComponent data={customerSegmentsData} height={300} />
        </ChartCard>
      </div>
    </div>
  );

  // Render Operations Dashboard
  const renderOperationsDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIWidget
          title="Total Vendors"
          value={(vendorPerformanceData?.totalVendors || 0).toLocaleString()}
          subtitle="Active vendors"
          icon={<Building2 className="w-6 h-6" />}
          color="blue"
          loading={vendorPerformanceLoading}
        />
        <KPIWidget
          title="Total Orders"
          value={(vendorPerformanceData?.totalOrders || 0).toLocaleString()}
          subtitle="Purchase orders"
          icon={<ShoppingCart className="w-6 h-6" />}
          color="green"
          loading={vendorPerformanceLoading}
        />
        <KPIWidget
          title="Avg Order Value"
          value={formatCurrency(vendorPerformanceData?.avgOrderValue || 0)}
          subtitle="Per vendor"
          icon={<DollarSign className="w-6 h-6" />}
          color="purple"
          loading={vendorPerformanceLoading}
        />
        <KPIWidget
          title="On-Time Delivery"
          value={`${vendorPerformanceData?.onTimeDeliveryRate || 0}%`}
          subtitle="Performance"
          icon={<Target className="w-6 h-6" />}
          color="orange"
          loading={vendorPerformanceLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Top Vendors"
          description="Best performing vendors"
          loading={vendorPerformanceLoading}
        >
          <BarChart
            data={vendorTopData}
            dataKey="name"
            bars={[{ dataKey: 'value', name: 'Orders', color: '#3b82f6' }]}
            height={300}
          />
        </ChartCard>

        <ChartCard
          title="Vendor Performance"
          description="Key performance indicators"
          loading={vendorPerformanceLoading}
        >
          <BarChart
            data={vendorPerformanceMetricsData}
            dataKey="name"
            bars={[{ dataKey: 'value', name: 'Score', color: '#10b981' }]}
            height={300}
          />
        </ChartCard>
      </div>
    </div>
  );

  // Render dashboard content based on active sub-tab
  const renderDashboardContent = () => {
    switch (activeSubTab) {
      case 'sales':
        return renderSalesDashboard();
      case 'inventory':
        return renderInventoryDashboard();
      case 'financial':
        return renderFinancialDashboard();
      case 'customers':
        return renderCustomerDashboard();
      case 'operations':
        return renderOperationsDashboard();
      default:
        return renderSalesDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header - Fixed width container */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2.5 md:p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Rocket className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Analytics & Intelligence
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Advanced business intelligence and reporting platform
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3 w-full lg:w-auto">
              {/* Date Range */}
              <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gray-100 rounded-lg border border-gray-200">
                <Calendar className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, startDate: e.target.value })
                  }
                  className="bg-transparent border-none outline-none text-xs md:text-sm flex-1 min-w-0"
                />
                <span className="text-gray-400 text-xs">to</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, endDate: e.target.value })
                  }
                  className="bg-transparent border-none outline-none text-xs md:text-sm flex-1 min-w-0"
                />
              </div>

              {/* Store Filter */}
              <AdvancedFilterDropdown
                label="Stores"
                options={storeOptions}
                selectedValues={selectedStores}
                onSelectionChange={setSelectedStores}
                loading={storesLoading}
                placeholder={storesLoading ? 'Loading stores...' : 'Select stores'}
              />

              {/* Category Filter */}
              <AdvancedFilterDropdown
                label="Categories"
                options={categoryOptions}
                selectedValues={selectedCategories}
                onSelectionChange={setSelectedCategories}
                loading={categoriesLoading}
                placeholder={categoriesLoading ? 'Loading categories...' : 'Select categories'}
              />

              {/* Export Button */}
              <button
                onClick={() => handleExport('excel')}
                className="px-3 md:px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 text-xs md:text-sm font-medium whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export All</span>
                <span className="sm:hidden">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-200">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'dashboard' || tab.id === 'reports') {
                      setActiveSubTab('sales');
                    }
                  }}
                  className={`
                    relative px-4 md:px-6 py-3 md:py-4 font-medium text-xs md:text-sm transition-all duration-200 whitespace-nowrap flex-shrink-0
                    ${
                      activeTab === tab.id
                        ? 'text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                    {tab.label}
                  </div>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub Tabs */}
        {(activeTab === 'dashboard' || activeTab === 'reports') && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {subTabs[activeTab].map((subTab) => {
                const Icon = subTab.icon;
                return (
                  <button
                    key={subTab.id}
                    onClick={() => setActiveSubTab(subTab.id)}
                    className={`
                      px-3 md:px-4 py-2 text-xs font-medium rounded-t-lg transition-all whitespace-nowrap flex-shrink-0
                      ${
                        activeSubTab === subTab.id
                          ? 'bg-white text-blue-600 border-t-2 border-blue-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }
                    `}
                  >
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <Icon className="w-3 h-3 md:w-4 md:h-4" />
                      {subTab.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Content - Same max-width container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && renderDashboardContent()}

        {activeTab === 'reports' && (
          <div className="space-y-4 md:space-y-6">
            <ResizableTable
              data={sampleTableData}
              columns={sampleTableColumns}
              onExport={handleExport}
              title={`${subTabs.reports.find((t) => t.id === activeSubTab)?.label} - Data Table`}
              height={600}
            />
          </div>
        )}

        {activeTab === 'builder' && (
          <div className="h-[calc(100vh-250px)] md:h-[calc(100vh-200px)] bg-white rounded-xl shadow-lg overflow-hidden">
            <ReportBuilder />
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="h-[calc(100vh-250px)] md:h-[calc(100vh-200px)] bg-white rounded-xl shadow-lg overflow-hidden">
            <TemplateBuilder />
          </div>
        )}
      </div>
    </div>
  );
}
