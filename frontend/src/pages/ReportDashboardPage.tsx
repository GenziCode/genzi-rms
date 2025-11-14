import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Settings,
  Save,
  RefreshCw,
  Filter,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import KPIWidget from '@/components/dashboard/KPIWidget';
import ChartCard from '@/components/dashboard/ChartCard';
import CustomizableTable from '@/components/reports/CustomizableTable';
import BarChart from '@/components/charts/BarChart';
import LineChart from '@/components/charts/LineChart';
import PieChart from '@/components/charts/PieChart';
import AreaChart from '@/components/charts/AreaChart';
import { useReportLayout } from '@/hooks/useReportLayout';
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  exportChartAsImage,
} from '@/utils/exportUtils';
import { salesReportsService } from '@/services/salesReports.service';
import { inventoryReportsService } from '@/services/inventoryReports.service';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, TrendingUp, Package, Users, ShoppingCart } from 'lucide-react';

// Report type mapping
const REPORT_CONFIGS: Record<
  string,
  {
    title: string;
    service: any;
    getKPIs: (data: any) => Array<{
      title: string;
      value: string | number;
      subtitle?: string;
      icon: any;
      color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
      trend?: { value: number; label: string };
    }>;
    getCharts: (data: any) => Array<{
      type: 'bar' | 'line' | 'pie' | 'area';
      title: string;
      data: any;
      config: any;
    }>;
    getTableData: (data: any) => Array<Record<string, any>>;
    getTableColumns: () => Array<{
      id: string;
      label: string;
      accessor: string | ((row: any) => any);
      visible: boolean;
      sortable?: boolean;
      format?: (value: any) => string;
    }>;
  }
> = {
  'daily-sales': {
    title: 'Daily Sales Dashboard',
    service: salesReportsService.getDailySalesSummary,
    getKPIs: (data) => [
      {
        title: 'Total Sales',
        value: formatCurrency(data?.summary?.totalSales || 0),
        subtitle: `${data?.summary?.totalTransactions || 0} transactions`,
        icon: DollarSign,
        color: 'green',
        trend: {
          value: 12.5,
          label: 'vs yesterday',
        },
      },
      {
        title: 'Average Transaction',
        value: formatCurrency(data?.summary?.avgTransactionValue || 0),
        icon: ShoppingCart,
        color: 'blue',
      },
      {
        title: 'Total Items',
        value: data?.summary?.totalItems || 0,
        icon: Package,
        color: 'purple',
      },
      {
        title: 'Total Discount',
        value: formatCurrency(data?.summary?.totalDiscount || 0),
        icon: TrendingUp,
        color: 'orange',
      },
    ],
    getCharts: (data) => [
      {
        type: 'line',
        title: 'Daily Sales Trend',
        data: data?.dailyData || [],
        config: {
          dataKey: 'date',
          lines: [
            { dataKey: 'totalSales', name: 'Sales', color: '#3b82f6' },
          ],
        },
      },
      {
        type: 'bar',
        title: 'Transactions by Day',
        data: data?.dailyData || [],
        config: {
          dataKey: 'date',
          bars: [
            { dataKey: 'totalTransactions', name: 'Transactions', color: '#10b981' },
          ],
        },
      },
    ],
    getTableData: (data) => data?.dailyData || [],
    getTableColumns: () => [
      { id: 'date', label: 'Date', accessor: 'date', visible: true, sortable: true },
      {
        id: 'totalSales',
        label: 'Total Sales',
        accessor: 'totalSales',
        visible: true,
        sortable: true,
        format: (val) => formatCurrency(val),
      },
      {
        id: 'totalTransactions',
        label: 'Transactions',
        accessor: 'totalTransactions',
        visible: true,
        sortable: true,
      },
      {
        id: 'avgTransactionValue',
        label: 'Avg Transaction',
        accessor: 'avgTransactionValue',
        visible: true,
        sortable: true,
        format: (val) => formatCurrency(val),
      },
    ],
  },
  'current-stock': {
    title: 'Current Stock Dashboard',
    service: inventoryReportsService.getCurrentStockStatus,
    getKPIs: (data) => [
      {
        title: 'Total Products',
        value: data?.summary?.totalProducts || 0,
        icon: Package,
        color: 'blue',
      },
      {
        title: 'Total Quantity',
        value: (data?.summary?.totalQuantity || 0).toLocaleString(),
        icon: Package,
        color: 'green',
      },
      {
        title: 'Low Stock',
        value: data?.summary?.lowStockCount || 0,
        icon: Package,
        color: 'orange',
      },
      {
        title: 'Out of Stock',
        value: data?.summary?.outOfStockCount || 0,
        icon: Package,
        color: 'red',
      },
    ],
    getCharts: (data) => [
      {
        type: 'pie',
        title: 'Stock Status Distribution',
        data: [
          { name: 'In Stock', value: (data?.summary?.totalProducts || 0) - (data?.summary?.lowStockCount || 0) - (data?.summary?.outOfStockCount || 0) },
          { name: 'Low Stock', value: data?.summary?.lowStockCount || 0 },
          { name: 'Out of Stock', value: data?.summary?.outOfStockCount || 0 },
        ],
        config: {},
      },
    ],
    getTableData: (data) => data?.products || [],
    getTableColumns: () => [
      { id: 'productName', label: 'Product', accessor: 'productName', visible: true, sortable: true },
      { id: 'currentStock', label: 'Current Stock', accessor: 'currentStock', visible: true, sortable: true },
      { id: 'status', label: 'Status', accessor: 'status', visible: true, sortable: true },
    ],
  },
};

function ReportDashboardPage() {
  const { reportType } = useParams<{ reportType: string }>();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [storeId, setStoreId] = useState<string>('');

  const config = reportType ? REPORT_CONFIGS[reportType] : null;
  const {
    currentLayout,
    saveLayout,
    loadLayout,
    createNewLayout,
  } = useReportLayout(reportType || 'default');

  // Fetch report data
  const {
    data: reportData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [`report-dashboard-${reportType}`, dateRange, storeId],
    queryFn: () => {
      if (!config) return Promise.resolve(null);
      return config.service({
        startDate: dateRange.startDate ? new Date(dateRange.startDate).toISOString() : undefined,
        endDate: dateRange.endDate ? new Date(dateRange.endDate).toISOString() : undefined,
        storeId: storeId || undefined,
      });
    },
    enabled: !!config,
  });

  const kpis = useMemo(() => {
    if (!config || !reportData) return [];
    return config.getKPIs(reportData);
  }, [config, reportData]);

  const charts = useMemo(() => {
    if (!config || !reportData) return [];
    return config.getCharts(reportData);
  }, [config, reportData]);

  const tableData = useMemo(() => {
    if (!config || !reportData) return [];
    return config.getTableData(reportData);
  }, [config, reportData]);

  const tableColumns = useMemo(() => {
    if (!config) return [];
    const baseColumns = config.getTableColumns();
    // Apply saved layout if available
    if (currentLayout) {
      return baseColumns.map((col) => {
        const saved = currentLayout.columns.find((c) => c.id === col.id);
        return {
          ...col,
          visible: saved?.visible ?? col.visible,
          width: saved?.width,
        };
      }).sort((a, b) => {
        const aOrder = currentLayout.columns.findIndex((c) => c.id === a.id);
        const bOrder = currentLayout.columns.findIndex((c) => c.id === b.id);
        return aOrder - bOrder;
      });
    }
    return baseColumns;
  }, [config, currentLayout]);

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (!config) return;

    const columns = tableColumns
      .filter((col) => col.visible)
      .map((col) => ({
        header: col.label,
        key: typeof col.accessor === 'string' ? col.accessor : col.id,
      }));

    const exportData = {
      columns,
      data: tableData,
      title: config.title,
    };

    switch (format) {
      case 'csv':
        exportToCSV(exportData);
        toast.success('Report exported as CSV');
        break;
      case 'excel':
        exportToExcel(exportData);
        toast.success('Report exported as Excel');
        break;
      case 'pdf':
        exportToPDF(exportData);
        toast.success('Report exported as PDF');
        break;
    }
  };

  const handleSaveLayout = () => {
    if (!config) return;

    const layout = createNewLayout(
      `${config.title} Layout`,
      tableColumns.map((col, index) => ({
        id: col.id,
        visible: col.visible,
        order: index,
        width: col.width,
      }))
    );

    saveLayout(layout);
    toast.success('Layout saved successfully');
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Not Found</h2>
          <p className="text-gray-600 mb-4">The requested report dashboard is not available.</p>
          <Link
            to="/reports"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/reports"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{config.title}</h1>
            <p className="text-gray-600 mt-1">
              Comprehensive analytics and insights
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleSaveLayout}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Layout
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <KPIWidget key={index} {...kpi} loading={isLoading} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {charts.map((chart, index) => (
          <ChartCard
            key={index}
            title={chart.title}
            loading={isLoading}
            onExport={() => {
              // Export chart as image
              const chartElement = document.getElementById(`chart-${index}`);
              exportChartAsImage(chartElement, chart.title);
            }}
          >
            <div id={`chart-${index}`}>
              {chart.type === 'bar' && (
                <BarChart
                  data={chart.data}
                  dataKey={chart.config.dataKey}
                  bars={chart.config.bars}
                />
              )}
              {chart.type === 'line' && (
                <LineChart
                  data={chart.data}
                  dataKey={chart.config.dataKey}
                  lines={chart.config.lines}
                />
              )}
              {chart.type === 'pie' && <PieChart data={chart.data} />}
              {chart.type === 'area' && (
                <AreaChart
                  data={chart.data}
                  dataKey={chart.config.dataKey}
                  areas={chart.config.areas}
                />
              )}
            </div>
          </ChartCard>
        ))}
      </div>

      {/* Data Table */}
      <CustomizableTable
        data={tableData}
        columns={tableColumns}
        onColumnsChange={(newColumns) => {
          // Update layout when columns change
          if (currentLayout) {
            saveLayout({
              ...currentLayout,
              columns: newColumns.map((col, index) => ({
                id: col.id,
                visible: col.visible,
                order: index,
                width: col.width,
              })),
            });
          }
        }}
        onExport={handleExport}
        loading={isLoading}
        title="Detailed Data"
      />
    </div>
  );
}

export default ReportDashboardPage;

