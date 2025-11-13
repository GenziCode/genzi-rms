import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package, AlertTriangle, TrendingUp, DollarSign, Activity,
  Plus, Minus, RefreshCw, FileText, Archive, Search, Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { inventoryService } from '@/services/inventory.service';
import { productsService } from '@/services/products.service';
import StockAdjustmentModal from '@/components/inventory/StockAdjustmentModal';
import StockAlertsWidget from '@/components/inventory/StockAlertsWidget';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'movements' | 'alerts' | 'reports'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [movementType, setMovementType] = useState('');

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

  const movements = movementsData?.movements || [];

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
        <button
          onClick={() => setShowAdjustment(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Adjust Stock
        </button>
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
                className={`px-4 py-3 border-b-2 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
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
                                  className={`h-full rounded-full ${
                                    isOut ? 'bg-red-500' : percentage < 50 ? 'bg-yellow-500' : 'bg-green-500'
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
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          movement.type === 'sale' ? 'bg-green-100 text-green-800' :
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
              <button className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Stock Status Report</span>
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Stock Movement Report</span>
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-medium">ABC Analysis</span>
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Dead Stock Report</span>
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
              </button>
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
    </div>
  );
}

