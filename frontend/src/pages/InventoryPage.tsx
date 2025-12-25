import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package, AlertTriangle, TrendingUp, DollarSign, Activity,
  Plus, Minus, RefreshCw, FileText, Archive, Search, Filter, ArrowRightLeft, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { inventoryService } from '@/services/inventory.service';
import { productsService } from '@/services/products.service';
import { inventoryReportsService } from '@/services/inventoryReports.service';
import StockAdjustmentModal from '@/components/inventory/StockAdjustmentModal';
import StockTransferModal from '@/components/inventory/StockTransferModal';
import StockAlertsWidget from '@/components/inventory/StockAlertsWidget';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'movements' | 'alerts' | 'reports'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [movementType, setMovementType] = useState('');
  const [activeQuickReport, setActiveQuickReport] = useState<
    'stock-status' | 'stock-movement' | 'abc-analysis' | 'dead-stock' | null
  >(null);

  // Fetch inventory status
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['inventory-status'],
    queryFn: () => inventoryService.getStatus(),
    refetchInterval: 30000, // Refresh every 30s
  });

  // Fetch inventory valuation
  const { data: valuation, isLoading: valuationLoading } = useQuery({
    queryKey: ['inventory-valuation'],
    queryFn: () => inventoryService.getValuation(),
  });

  // Fetch low stock products
  const { data: lowStockProducts = [], isLoading: lowStockLoading } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => inventoryService.getLowStock(),
  });

  // Fetch stock movements
  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: ['stock-movements', movementType],
    queryFn: () => inventoryService.getMovements({
      type: movementType || undefined,
      limit: 50,
    }),
    enabled: activeTab === 'movements',
  });

  // Fetch alerts
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['inventory-alerts'],
    queryFn: () => inventoryService.getAlerts({ status: 'active' }),
    enabled: activeTab === 'alerts',
  });

  const currentStockEnabled =
    activeQuickReport === 'stock-status' ||
    activeQuickReport === 'abc-analysis' ||
    activeQuickReport === 'dead-stock';

  const { data: currentStockReport, isLoading: currentStockLoading } = useQuery({
    queryKey: ['inventory-report-current-stock'],
    queryFn: () => inventoryReportsService.getCurrentStockStatus(),
    enabled: currentStockEnabled,
  });

  const { data: stockMovementReport, isLoading: stockMovementLoading } = useQuery({
    queryKey: ['inventory-report-stock-movement'],
    queryFn: () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);
      return inventoryReportsService.getStockMovement({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    },
    enabled: activeQuickReport === 'stock-movement',
  });

  const { data: deadStockMovementReport, isLoading: deadStockMovementLoading } = useQuery({
    queryKey: ['inventory-report-dead-stock-movement'],
    queryFn: () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 90);
      return inventoryReportsService.getStockMovement({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    },
    enabled: activeQuickReport === 'dead-stock',
  });

  const movements = movementsData?.movements || [];

  const abcAnalysis = useMemo(() => {
    if (!currentStockReport) return null;
    const sorted = [...currentStockReport.products].sort(
      (a, b) => b.totalValue - a.totalValue
    );
    const totalValue = sorted.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    let cumulativeValue = 0;
    return sorted.map((item) => {
      cumulativeValue += item.totalValue || 0;
      const share = totalValue > 0 ? cumulativeValue / totalValue : 0;
      const bucket = share <= 0.8 ? 'A' : share <= 0.95 ? 'B' : 'C';
      return { ...item, bucket, share };
    });
  }, [currentStockReport]);

  const deadStockProducts = useMemo(() => {
    if (!currentStockReport) return [];
    const activeProductIds = new Set(
      deadStockMovementReport?.movements.map((movement) => movement.productId) || []
    );
    return currentStockReport.products.filter(
      (product) => product.currentStock > 0 && !activeProductIds.has(product.productId)
    );
  }, [currentStockReport, deadStockMovementReport]);

  const abcSummary = useMemo(() => {
    if (!abcAnalysis) return null;
    return abcAnalysis.reduce(
      (acc, item) => {
        acc[item.bucket].count += 1;
        acc[item.bucket].value += item.totalValue || 0;
        return acc;
      },
      {
        A: { count: 0, value: 0 },
        B: { count: 0, value: 0 },
        C: { count: 0, value: 0 },
      }
    );
  }, [abcAnalysis]);

  const deadStockSummary = useMemo(() => {
    const totalValue = deadStockProducts.reduce(
      (sum, item) => sum + (item.totalValue || 0),
      0
    );
    return {
      count: deadStockProducts.length,
      totalValue,
    };
  }, [deadStockProducts]);

  const stats = [
    {
      title: 'Total Products',
      value: status?.totalProducts || 0,
      icon: Package,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Inventory Value',
      value: `$${(status?.totalValue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Low Stock Items',
      value: status?.lowStockItems || 0,
      icon: AlertTriangle,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
    {
      title: 'Out of Stock',
      value: status?.outOfStockItems || 0,
      icon: Activity,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Package },
    { id: 'movements', label: 'Stock Movements', icon: Activity },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: alerts.length },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Track and manage your stock levels</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTransfer(true)}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <ArrowRightLeft className="w-5 h-5" />
            Transfer Stock
          </button>
          <button
            onClick={() => setShowAdjustment(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Adjust Stock
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">{stat.title}</h3>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 border-b-2 font-medium transition-colors flex items-center gap-2 ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Valuation */}
          {valuation && (
            <div className="bg-white rounded-lg shadow border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory Valuation</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">${(valuation.totalValue || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Cost</p>
                  <p className="text-2xl font-bold text-gray-900">${(valuation.totalCost || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Potential Profit</p>
                  <p className="text-2xl font-bold text-green-600">${(valuation.totalProfit || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Profit Margin</p>
                  <p className="text-2xl font-bold text-blue-600">{(valuation.profitMargin || 0).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Low Stock Products */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  Low Stock Products ({lowStockProducts.length})
                </h2>
                <button
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['low-stock'] })}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              {lowStockLoading ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading...</p>
                </div>
              ) : lowStockProducts.length === 0 ? (
                <div className="p-12 text-center">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No low stock items</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {lowStockProducts.map((product) => {
                      const isOut = product.currentStock === 0;
                      const percentage = product.minStock > 0
                        ? (product.currentStock / product.minStock) * 100
                        : 100;

                      return (
                        <tr key={product._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <p className="text-sm text-gray-500">{product.category}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{product.sku}</td>
                          <td className="px-6 py-4">
                            <span className={`text-lg font-bold ${isOut ? 'text-red-600' : 'text-yellow-600'}`}>
                              {product.currentStock}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{product.minStock}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                                <div
                                  className={`h-full rounded-full ${isOut ? 'bg-red-500' : percentage < 50 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600">{percentage.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowAdjustment(true);
                              }}
                              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                            >
                              Restock
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'movements' && (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Stock Movement History</h2>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['stock-movements'] })}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
            <div className="flex gap-3">
              <select
                value={movementType}
                onChange={(e) => setMovementType(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="sale">Sales</option>
                <option value="adjustment">Adjustments</option>
                <option value="transfer_in">Transfer In</option>
                <option value="transfer_out">Transfer Out</option>
                <option value="return">Returns</option>
                <option value="damage">Damaged</option>
                <option value="restock">Restock</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            {movementsLoading ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading movements...</p>
              </div>
            ) : movements.length === 0 ? (
              <div className="p-12 text-center">
                <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No stock movements found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Before</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">After</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {movements.map((movement) => (
                    <tr key={movement._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(movement.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{movement.productName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${movement.type === 'sale' ? 'bg-green-100 text-green-800' :
                            movement.type === 'adjustment' ? 'bg-blue-100 text-blue-800' :
                              movement.type === 'damage' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                          }`}>
                          {movement.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{movement.balanceBefore}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{movement.balanceAfter}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{movement.reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <StockAlertsWidget alerts={alerts} isLoading={alertsLoading} />
      )}

      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Valuation by Category */}
          {valuation && valuation.byCategory && valuation.byCategory.length > 0 ? (
            <div className="bg-white rounded-lg shadow border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Valuation by Category</h3>
              <div className="space-y-3">
                {valuation.byCategory.map((cat, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{cat.categoryName}</p>
                      <p className="text-sm text-gray-600">{cat.itemCount} items</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">${(cat.value || 0).toLocaleString()}</p>
                      <p className="text-sm text-green-600">Profit: ${(cat.profit || 0).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow border p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No valuation data available</p>
            </div>
          )}

          {/* Quick Reports */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Reports</h3>
            <div className="space-y-2">
              <button
                onClick={() => setActiveQuickReport('stock-status')}
                className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Stock Status Report</span>
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
              </button>
              <button
                onClick={() => setActiveQuickReport('stock-movement')}
                className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Stock Movement Report</span>
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
              </button>
              <button
                onClick={() => setActiveQuickReport('abc-analysis')}
                className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">ABC Analysis</span>
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
              </button>
              <button
                onClick={() => setActiveQuickReport('dead-stock')}
                className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Dead Stock Report</span>
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeQuickReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {activeQuickReport === 'stock-status' && 'Stock Status Report'}
                {activeQuickReport === 'stock-movement' && 'Stock Movement Report'}
                {activeQuickReport === 'abc-analysis' && 'ABC Analysis'}
                {activeQuickReport === 'dead-stock' && 'Dead Stock Report'}
              </h2>
              <button
                onClick={() => setActiveQuickReport(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              {activeQuickReport === 'stock-status' && (
                <>
                  {currentStockLoading ? (
                    <div className="p-12 text-center">
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading report...</p>
                    </div>
                  ) : currentStockReport ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-xs text-gray-500">Total Products</p>
                          <p className="text-xl font-bold text-gray-900">{currentStockReport.summary.totalProducts}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-xs text-gray-500">Total Quantity</p>
                          <p className="text-xl font-bold text-gray-900">{currentStockReport.summary.totalQuantity}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-xs text-gray-500">Low Stock</p>
                          <p className="text-xl font-bold text-amber-600">{currentStockReport.summary.lowStockCount}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-xs text-gray-500">Out of Stock</p>
                          <p className="text-xl font-bold text-red-600">{currentStockReport.summary.outOfStockCount}</p>
                        </div>
                      </div>
                      <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reorder Point</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {currentStockReport.products.map((product) => (
                              <tr key={product.productId} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{product.productName}</td>
                                <td className="px-4 py-3 text-gray-600">{product.sku}</td>
                                <td className="px-4 py-3 text-gray-600">{product.category}</td>
                                <td className="px-4 py-3 text-right font-medium text-gray-900">{product.currentStock}</td>
                                <td className="px-4 py-3 text-right text-gray-600">{product.reorderPoint}</td>
                                <td className="px-4 py-3 text-right text-gray-900">
                                  ${(product.totalValue || 0).toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                  {(() => {
                                    const status = product.status || 'in_stock';
                                    const badgeClass =
                                      status === 'low_stock'
                                        ? 'bg-amber-100 text-amber-700'
                                        : status === 'out_of_stock'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-green-100 text-green-700';

                                    return (
                                      <span
                                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${badgeClass}`}
                                      >
                                        {status.replace('_', ' ')}
                                      </span>
                                    );
                                  })()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-600">No data available.</p>
                  )}
                </>
              )}

              {activeQuickReport === 'stock-movement' && (
                <>
                  {stockMovementLoading ? (
                    <div className="p-12 text-center">
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading report...</p>
                    </div>
                  ) : stockMovementReport ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-xs text-gray-500">Total Movements</p>
                          <p className="text-xl font-bold text-gray-900">{stockMovementReport.summary.totalMovements}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-xs text-gray-500">Stock In</p>
                          <p className="text-xl font-bold text-green-600">{stockMovementReport.summary.stockIn}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-xs text-gray-500">Stock Out</p>
                          <p className="text-xl font-bold text-red-600">{stockMovementReport.summary.stockOut}</p>
                        </div>
                      </div>
                      <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {stockMovementReport.movements.map((movement, index) => (
                              <tr key={`${movement.reference}-${index}`} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-600">
                                  {new Date(movement.date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 font-medium text-gray-900">{movement.productName}</td>
                                <td className="px-4 py-3 text-gray-600">{movement.type}</td>
                                <td className="px-4 py-3 text-right font-medium text-gray-900">
                                  {movement.quantity}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-600">
                                  ${movement.totalValue?.toLocaleString() || '0'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-600">No data available.</p>
                  )}
                </>
              )}

              {activeQuickReport === 'abc-analysis' && (
                <>
                  {currentStockLoading ? (
                    <div className="p-12 text-center">
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading report...</p>
                    </div>
                  ) : abcAnalysis && abcSummary ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(['A', 'B', 'C'] as const).map((bucket) => (
                          <div key={bucket} className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500">Class {bucket}</p>
                            <p className="text-xl font-bold text-gray-900">{abcSummary[bucket].count} items</p>
                              <p className="text-sm text-gray-600">
                              Value ${abcSummary[bucket].value.toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Class</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {abcAnalysis.map((item) => (
                              <tr key={item.productId} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{item.productName}</td>
                                <td className="px-4 py-3 text-gray-600">{item.category}</td>
                                <td className="px-4 py-3 text-right text-gray-900">${(item.totalValue || 0).toLocaleString()}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                    item.bucket === 'A'
                                      ? 'bg-green-100 text-green-700'
                                      : item.bucket === 'B'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {item.bucket}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-600">No data available.</p>
                  )}
                </>
              )}

              {activeQuickReport === 'dead-stock' && (
                <>
                  {deadStockMovementLoading || currentStockLoading ? (
                    <div className="p-12 text-center">
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading report...</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-xs text-gray-500">Dead stock items</p>
                          <p className="text-xl font-bold text-gray-900">{deadStockSummary.count}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-xs text-gray-500">Total value</p>
                          <p className="text-xl font-bold text-gray-900">${deadStockSummary.totalValue.toLocaleString()}</p>
                        </div>
                      </div>
                      {deadStockProducts.length === 0 ? (
                        <p className="text-gray-600">No dead stock items detected in the last 90 days.</p>
                      ) : (
                        <div className="overflow-x-auto border rounded-lg">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {deadStockProducts.map((product) => (
                                <tr key={product.productId} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 font-medium text-gray-900">{product.productName}</td>
                                  <td className="px-4 py-3 text-gray-600">{product.sku}</td>
                                  <td className="px-4 py-3 text-gray-600">{product.category}</td>
                                  <td className="px-4 py-3 text-right text-gray-900">{product.currentStock}</td>
                                  <td className="px-4 py-3 text-right text-gray-900">${(product.totalValue || 0).toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAdjustment && (
        <StockAdjustmentModal
          product={selectedProduct}
          onClose={() => {
            setShowAdjustment(false);
            setSelectedProduct(null);
          }}
          onSuccess={() => {
            setShowAdjustment(false);
            setSelectedProduct(null);
            queryClient.invalidateQueries({ queryKey: ['inventory-status'] });
            queryClient.invalidateQueries({ queryKey: ['low-stock'] });
            queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
          }}
        />
      )}

      {showTransfer && (
        <StockTransferModal
          onClose={() => setShowTransfer(false)}
        />
      )}
    </div>
  );
}
