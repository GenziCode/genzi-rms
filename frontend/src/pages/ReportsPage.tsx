import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Calendar,
  Download,
  BarChart3,
  FileText,
  AlertTriangle,
  ShoppingCart,
  TrendingDown,
  Percent,
  RotateCcw,
  Target,
  Box,
  ArrowRight,
  FolderOpen,
  Search,
  Sparkles,
  Zap,
  Activity,
  Clock,
  TrendingUp as TrendingUpIcon,
  Rocket,
  Grid3x3,
  List,
  Star,
} from 'lucide-react';
import { salesReportsService } from '@/services/salesReports.service';
import { formatCurrency } from '@/lib/utils';
import BarChart from '@/components/charts/BarChart';
import LineChartComponent from '@/components/charts/LineChart';
import PieChartComponent from '@/components/charts/PieChart';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Report {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  category: 'sales' | 'inventory' | 'financial' | 'customer' | 'operational';
  popularity?: number;
  lastUsed?: string;
  hasChart?: boolean;
  chartData?: any;
}

const reports: Report[] = [
  {
    id: 'daily-sales',
    name: 'Daily Sales Summary',
    description: 'View daily sales performance and transactions with detailed analytics',
    icon: Calendar,
    href: '/reports/daily-sales',
    category: 'sales',
    popularity: 95,
    lastUsed: '2 hours ago',
    hasChart: true,
    chartData: {
      type: 'line',
      data: [
        { date: 'Mon', sales: 12000 },
        { date: 'Tue', sales: 15000 },
        { date: 'Wed', sales: 18000 },
        { date: 'Thu', sales: 14000 },
        { date: 'Fri', sales: 22000 },
      ],
    },
  },
  {
    id: 'weekly-sales',
    name: 'Weekly Sales Report',
    description: 'Weekly sales analysis with week-over-week comparison and trends',
    icon: Calendar,
    href: '/reports/weekly-sales',
    category: 'sales',
    popularity: 88,
    lastUsed: '1 day ago',
    hasChart: true,
  },
  {
    id: 'monthly-sales',
    name: 'Monthly Sales Report',
    description: 'Monthly sales trends and year-over-year comparison insights',
    icon: Calendar,
    href: '/reports/monthly-sales',
    category: 'sales',
    popularity: 82,
    lastUsed: '3 days ago',
    hasChart: true,
  },
  {
    id: 'sales-by-product',
    name: 'Sales by Product',
    description: 'Analyze sales performance by individual products with rankings',
    icon: Package,
    href: '/reports/sales-by-product',
    category: 'sales',
    popularity: 90,
    lastUsed: '5 hours ago',
    hasChart: true,
    chartData: {
      type: 'bar',
      data: [
        { product: 'Product A', sales: 15000 },
        { product: 'Product B', sales: 22000 },
        { product: 'Product C', sales: 18000 },
      ],
    },
  },
  {
    id: 'sales-by-category',
    name: 'Sales by Category',
    description: 'Sales breakdown by product categories with visual distribution',
    icon: FolderOpen,
    href: '/reports/sales-by-category',
    category: 'sales',
    popularity: 75,
    lastUsed: '1 day ago',
    hasChart: true,
    chartData: {
      type: 'pie',
      data: [
        { name: 'Electronics', value: 35 },
        { name: 'Clothing', value: 25 },
        { name: 'Food', value: 40 },
      ],
    },
  },
  {
    id: 'sales-by-store',
    name: 'Sales by Store',
    description: 'Compare sales performance across different store locations',
    icon: ShoppingCart,
    href: '/reports/sales-by-store',
    category: 'sales',
    popularity: 85,
    lastUsed: '6 hours ago',
    hasChart: true,
  },
  {
    id: 'sales-by-employee',
    name: 'Sales by Employee',
    description: 'Track sales performance by cashier and employee metrics',
    icon: Users,
    href: '/reports/sales-by-employee',
    category: 'sales',
    popularity: 70,
    lastUsed: '2 days ago',
  },
  {
    id: 'sales-by-customer',
    name: 'Sales by Customer',
    description: 'Customer purchase history and spending pattern analysis',
    icon: Users,
    href: '/reports/sales-by-customer',
    category: 'sales',
    popularity: 78,
    lastUsed: '1 day ago',
  },
  {
    id: 'sales-comparison',
    name: 'Sales Comparison',
    description: 'Compare sales between two time periods with detailed metrics',
    icon: BarChart3,
    href: '/reports/sales-comparison',
    category: 'sales',
    popularity: 80,
    lastUsed: '4 hours ago',
    hasChart: true,
  },
  {
    id: 'top-selling-products',
    name: 'Top Selling Products',
    description: 'Best performing products by revenue, quantity, or transactions',
    icon: TrendingUp,
    href: '/reports/top-selling-products',
    category: 'sales',
    popularity: 92,
    lastUsed: '1 hour ago',
    hasChart: true,
  },
  {
    id: 'bottom-selling-products',
    name: 'Bottom Selling Products',
    description: 'Products with lowest sales performance requiring attention',
    icon: TrendingDown,
    href: '/reports/bottom-selling-products',
    category: 'sales',
    popularity: 65,
    lastUsed: '1 week ago',
  },
  {
    id: 'sales-trend-analysis',
    name: 'Sales Trend Analysis',
    description: 'Analyze sales trends and patterns over time with forecasting',
    icon: TrendingUpIcon,
    href: '/reports/sales-trend-analysis',
    category: 'sales',
    popularity: 87,
    lastUsed: '3 hours ago',
    hasChart: true,
  },
  {
    id: 'discount-analysis',
    name: 'Discount Analysis',
    description: 'Analyze discount usage and its impact on sales revenue',
    icon: Percent,
    href: '/reports/discount-analysis',
    category: 'sales',
    popularity: 72,
    lastUsed: '2 days ago',
  },
  {
    id: 'return-refund',
    name: 'Return/Refund Report',
    description: 'Track returns, refunds, and cancelled transactions',
    icon: RotateCcw,
    href: '/reports/return-refund',
    category: 'sales',
    popularity: 68,
    lastUsed: '3 days ago',
  },
  {
    id: 'sales-forecast',
    name: 'Sales Forecast',
    description: 'Predict future sales based on historical data and AI insights',
    icon: Target,
    href: '/reports/sales-forecast',
    category: 'sales',
    popularity: 88,
    lastUsed: '5 hours ago',
    hasChart: true,
  },
  {
    id: 'current-stock',
    name: 'Current Stock Status',
    description: 'View current inventory levels for all products with alerts',
    icon: Package,
    href: '/reports/current-stock',
    category: 'inventory',
    popularity: 90,
    lastUsed: '1 hour ago',
    hasChart: true,
  },
  {
    id: 'low-stock',
    name: 'Low Stock Alert',
    description: 'Products below reorder point requiring immediate attention',
    icon: AlertTriangle,
    href: '/reports/low-stock',
    category: 'inventory',
    popularity: 95,
    lastUsed: '30 minutes ago',
  },
  {
    id: 'overstock',
    name: 'Overstock Report',
    description: 'Products exceeding maximum stock levels for optimization',
    icon: Box,
    href: '/reports/overstock',
    category: 'inventory',
    popularity: 60,
    lastUsed: '1 week ago',
  },
  {
    id: 'stock-movement',
    name: 'Stock Movement Report',
    description: 'Track stock movements (in/out) over time with trends',
    icon: TrendingUp,
    href: '/reports/stock-movement',
    category: 'inventory',
    popularity: 75,
    lastUsed: '2 days ago',
    hasChart: true,
  },
  {
    id: 'stock-valuation',
    name: 'Stock Valuation Report',
    description: 'Current inventory value by product and category breakdown',
    icon: DollarSign,
    href: '/reports/stock-valuation',
    category: 'inventory',
    popularity: 82,
    lastUsed: '1 day ago',
    hasChart: true,
  },
];

const categoryConfig = {
  sales: {
    name: 'Sales Analytics',
    icon: TrendingUp,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    description: 'Comprehensive sales analytics and performance metrics',
    count: reports.filter((r) => r.category === 'sales').length,
  },
  inventory: {
    name: 'Inventory Intelligence',
    icon: Package,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    description: 'Stock levels, movements, and valuation reports',
    count: reports.filter((r) => r.category === 'inventory').length,
  },
  financial: {
    name: 'Financial Reports',
    icon: DollarSign,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    description: 'Profit & loss, balance sheets, and financial statements',
    count: 0,
  },
  customer: {
    name: 'Customer Insights',
    icon: Users,
    color: 'from-indigo-500 to-blue-500',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
    description: 'Customer insights, lifetime value, and segmentation',
    count: 0,
  },
  operational: {
    name: 'Operations',
    icon: BarChart3,
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    description: 'Purchase orders, vendor performance, and operations',
    count: 0,
  },
};

type ViewMode = 'grid' | 'list';
type SortBy = 'popularity' | 'name' | 'recent';

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('popularity');
  const [hoveredReport, setHoveredReport] = useState<string | null>(null);

  // Fetch quick stats
  const { data: quickStats, isLoading: statsLoading } = useQuery({
    queryKey: ['reports-quick-stats'],
    queryFn: async () => {
      try {
        const data = await salesReportsService.getDailySalesSummary({
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        });
        return data;
      } catch (error) {
        console.error('Error fetching quick stats:', error);
        return null;
      }
    },
  });

  const filteredReports = useMemo(() => {
    let filtered = reports;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((r) => r.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return (b.popularity || 0) - (a.popularity || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
          return (b.lastUsed || '').localeCompare(a.lastUsed || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, selectedCategory, sortBy]);

  const renderChartPreview = (report: Report) => {
    if (!report.hasChart || !report.chartData) return null;

    const { type, data } = report.chartData;

    return (
      <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-2 mt-3">
        {type === 'line' && (
          <LineChartComponent
            data={data}
            dataKey="date"
            lines={[{ dataKey: 'sales', name: 'Sales', color: '#3b82f6' }]}
            height={120}
            showLegend={false}
            showGrid={false}
          />
        )}
        {type === 'bar' && (
          <BarChart
            data={data}
            dataKey="product"
            bars={[{ dataKey: 'sales', name: 'Sales', color: '#10b981' }]}
            height={120}
            showLegend={false}
            showGrid={false}
          />
        )}
        {type === 'pie' && (
          <PieChartComponent data={data} height={120} showLegend={false} />
        )}
      </div>
    );
  };

  const renderReportCard = (report: Report) => {
    const Icon = report.icon;
    const config = categoryConfig[report.category];
    const hasDashboard = ['daily-sales', 'current-stock'].includes(report.id);
    const isHovered = hoveredReport === report.id;

    return (
      <div
        key={report.id}
        onMouseEnter={() => setHoveredReport(report.id)}
        onMouseLeave={() => setHoveredReport(null)}
        className={`
          group relative bg-white rounded-2xl shadow-lg border-2 overflow-hidden
          transition-all duration-300 transform
          ${isHovered ? 'border-blue-500 shadow-2xl scale-[1.02]' : 'border-gray-200 hover:border-gray-300'}
        `}
      >
        {/* Gradient Header */}
        <div className={`h-1.5 bg-gradient-to-r ${config.color}`} />

        {/* Content */}
        <div className="p-5 md:p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className={`p-2.5 md:p-3 rounded-xl bg-gradient-to-br ${config.color} shadow-lg`}>
              <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {report.popularity && report.popularity > 80 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 rounded-lg">
                  <Star className="w-3 h-3 text-yellow-600 fill-yellow-600" />
                  <span className="text-xs font-medium text-yellow-700 hidden sm:inline">Popular</span>
                </div>
              )}
              {hasDashboard && (
                <Link
                  to={`/reports/dashboard/${report.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
                >
                  <Grid3x3 className="w-3 h-3 inline mr-1" />
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Title & Description */}
          <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
            {report.name}
          </h3>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">{report.description}</p>

          {/* Chart Preview */}
          {renderChartPreview(report)}

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3 md:gap-4 text-xs text-gray-500 flex-wrap">
              {report.lastUsed && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className="whitespace-nowrap">{report.lastUsed}</span>
                </div>
              )}
              {report.popularity && (
                <div className="flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  <span className="whitespace-nowrap">{report.popularity}% usage</span>
                </div>
              )}
            </div>
            <Link
              to={report.href}
              className={`
                w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                transition-all duration-200 whitespace-nowrap
                ${isHovered
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <span>View Report</span>
              <ArrowRight className={`w-4 h-4 transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
            </Link>
          </div>
        </div>

        {/* Hover Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 pointer-events-none rounded-2xl" />
        )}
      </div>
    );
  };

  const renderListView = () => (
    <div className="space-y-3">
      {filteredReports.map((report) => {
        const Icon = report.icon;
        const config = categoryConfig[report.category];
        const isHovered = hoveredReport === report.id;

        return (
          <div
            key={report.id}
            onMouseEnter={() => setHoveredReport(report.id)}
            onMouseLeave={() => setHoveredReport(null)}
            className={`
              group bg-white rounded-xl shadow-md border-2 p-4 md:p-5
              transition-all duration-200
              ${isHovered ? 'border-blue-500 shadow-lg' : 'border-gray-200'}
            `}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2.5 md:p-3 rounded-lg bg-gradient-to-br ${config.color} flex-shrink-0`}>
                <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {report.name}
                  </h3>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {report.popularity && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Activity className="w-3 h-3" />
                        {report.popularity}%
                      </div>
                    )}
                    <Link
                      to={report.href}
                      className="px-3 md:px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs md:text-sm font-medium transition-colors whitespace-nowrap"
                    >
                      Open
                    </Link>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2 line-clamp-1">{report.description}</p>
                <div className="flex items-center gap-3 md:gap-4 text-xs text-gray-500 flex-wrap">
                  {report.lastUsed && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {report.lastUsed}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded ${config.bgColor} ${config.textColor} font-medium whitespace-nowrap`}>
                    {config.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Header - Fixed width container */}
      <div className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
        <div className="relative px-4 sm:px-6 lg:px-8 py-10 md:py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="p-3 md:p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Rocket className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Business Intelligence Hub
                </h1>
                <p className="text-blue-200 text-base md:text-lg">
                  Advanced analytics, insights, and reporting platform
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 md:mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-blue-300" />
                  <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                </div>
                <p className="text-xs text-blue-200 mb-1">Total Revenue</p>
                <p className="text-xl md:text-2xl font-bold">
                  {statsLoading ? '...' : formatCurrency(quickStats?.summary?.totalSales || 0)}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-blue-300" />
                  <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                </div>
                <p className="text-xs text-blue-200 mb-1">Transactions</p>
                <p className="text-xl md:text-2xl font-bold">
                  {statsLoading ? '...' : (quickStats?.summary?.totalTransactions || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <Package className="w-4 h-4 md:w-5 md:h-5 text-blue-300" />
                  <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                </div>
                <p className="text-xs text-blue-200 mb-1">Items Sold</p>
                <p className="text-xl md:text-2xl font-bold">
                  {statsLoading ? '...' : (quickStats?.summary?.totalItems || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-blue-300" />
                  <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-yellow-400" />
                </div>
                <p className="text-xs text-blue-200 mb-1">Available Reports</p>
                <p className="text-xl md:text-2xl font-bold">{reports.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Same max-width container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-4 md:p-6 mb-6 md:mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Search */}
            <div className="flex-1 w-full lg:w-auto">
              <div className="relative">
                <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reports by name or description..."
                  className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-sm md:text-base"
                />
              </div>
            </div>

            {/* View Mode & Sort */}
            <div className="flex items-center gap-2 md:gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid3x3 className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  aria-label="List view"
                >
                  <List className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="px-3 md:px-4 py-2 md:py-2.5 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-sm font-medium"
              >
                <option value="popularity">Most Popular</option>
                <option value="name">Name (A-Z)</option>
                <option value="recent">Recently Used</option>
              </select>

              <Link
                to="/reports-analytics"
                className="px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-medium text-sm whitespace-nowrap"
              >
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Advanced Analytics</span>
                <span className="sm:hidden">Analytics</span>
              </Link>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mt-5 md:mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`
                px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-medium text-xs md:text-sm whitespace-nowrap transition-all flex-shrink-0
                ${
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              All Reports ({reports.length})
            </button>
            {Object.entries(categoryConfig).map(([key, config]) => {
              if (config.count === 0 && key !== 'sales' && key !== 'inventory') return null;
              const Icon = config.icon;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`
                    px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-medium text-xs md:text-sm whitespace-nowrap transition-all flex items-center gap-2 flex-shrink-0
                    ${
                      selectedCategory === key
                        ? `bg-gradient-to-r ${config.color} text-white shadow-lg`
                        : `${config.bgColor} ${config.textColor} hover:shadow-md`
                    }
                  `}
                >
                  <Icon className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">{config.name}</span>
                  <span className="sm:hidden">{config.name.split(' ')[0]}</span>
                  <span className="ml-1">({config.count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reports Grid/List */}
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center">
            <Search className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredReports.map(renderReportCard)}
          </div>
        ) : (
          renderListView()
        )}

        {/* Quick Access Section */}
        <div className="mt-8 md:mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-6 md:p-8 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-2">Need More Power?</h2>
              <p className="text-blue-100 text-sm md:text-base">
                Access advanced analytics, custom report builder, and template management
              </p>
            </div>
            <Link
              to="/reports-analytics"
              className="px-5 md:px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 font-semibold transition-all flex items-center gap-2 shadow-lg whitespace-nowrap"
            >
              <Rocket className="w-5 h-5" />
              Launch Advanced Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
