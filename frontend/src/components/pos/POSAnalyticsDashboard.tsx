import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Clock,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { posService } from '@/services/pos.service';
import { productsService } from '@/services/products.service';
import { customersService } from '@/services/customers.service';

interface POSAnalyticsDashboardProps {
  onToggleQueuePanel?: () => void;
}

interface SalesMetrics {
  todaySales: number;
  todayTransactions: number;
  averageTransaction: number;
  topProducts: Array<{
    name: string;
    sales: number;
    quantity: number;
  }>;
  hourlySales: Array<{
    hour: number;
    sales: number;
    transactions: number;
  }>;
  paymentMethods: Array<{
    method: string;
    amount: number;
    percentage: number;
  }>;
}

export default function POSAnalyticsDashboard({ onToggleQueuePanel }: POSAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - in real app, this would come from APIs
  const mockMetrics: SalesMetrics = {
    todaySales: 2847.50,
    todayTransactions: 23,
    averageTransaction: 123.80,
    topProducts: [
      { name: 'Wireless Headphones', sales: 450.00, quantity: 5 },
      { name: 'Smart Watch', sales: 380.00, quantity: 3 },
      { name: 'Laptop Stand', sales: 120.00, quantity: 8 },
      { name: 'USB Cable', sales: 80.00, quantity: 12 },
      { name: 'Phone Case', sales: 60.00, quantity: 6 }
    ],
    hourlySales: [
      { hour: 9, sales: 120.50, transactions: 2 },
      { hour: 10, sales: 245.75, transactions: 3 },
      { hour: 11, sales: 180.25, transactions: 2 },
      { hour: 12, sales: 320.00, transactions: 4 },
      { hour: 13, sales: 156.80, transactions: 2 },
      { hour: 14, sales: 298.40, transactions: 3 },
      { hour: 15, sales: 412.60, transactions: 5 },
      { hour: 16, sales: 378.90, transactions: 4 },
      { hour: 17, sales: 534.30, transactions: 6 }
    ],
    paymentMethods: [
      { method: 'Cash', amount: 1200.50, percentage: 42.2 },
      { method: 'Card', amount: 1350.75, percentage: 47.5 },
      { method: 'Mobile', amount: 296.25, percentage: 10.4 }
    ]
  };

  const { data: lowStockProducts } = useQuery({
    queryKey: ['low-stock-products'],
    queryFn: () => productsService.getLowStock(),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: recentCustomers } = useQuery({
    queryKey: ['recent-customers'],
    queryFn: () => customersService.getRecent(),
    refetchInterval: 60000 // Refresh every minute
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    // In real app, this would invalidate queries
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="w-96 bg-white border-l flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            <h2 className="text-lg font-semibold">POS Analytics</h2>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1 hover:bg-blue-500 rounded transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-1">
          {[
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' }
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTimeRange(value as any)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                timeRange === value
                  ? 'bg-white text-blue-600'
                  : 'text-blue-100 hover:bg-blue-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Key Metrics */}
        <div className="p-4 border-b">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Today's Performance</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-700 font-medium">Sales</span>
              </div>
              <p className="text-lg font-bold text-green-900">{formatCurrency(mockMetrics.todaySales)}</p>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12.5%
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-blue-700 font-medium">Transactions</span>
              </div>
              <p className="text-lg font-bold text-blue-900">{mockMetrics.todayTransactions}</p>
              <div className="flex items-center text-xs text-blue-600 mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +8.2%
              </div>
            </div>

            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-purple-700 font-medium">Avg Order</span>
              </div>
              <p className="text-lg font-bold text-purple-900">{formatCurrency(mockMetrics.averageTransaction)}</p>
              <div className="flex items-center text-xs text-purple-600 mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +5.1%
              </div>
            </div>

            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-orange-600" />
                <span className="text-xs text-orange-700 font-medium">Customers</span>
              </div>
              <p className="text-lg font-bold text-orange-900">18</p>
              <div className="flex items-center text-xs text-orange-600 mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +15.3%
              </div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="p-4 border-b">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Top Products Today</h3>
          <div className="space-y-2">
            {mockMetrics.topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    #{index + 1}
                  </span>
                  <span className="text-sm text-gray-900 truncate">{product.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(product.sales)}</p>
                  <p className="text-xs text-gray-500">{product.quantity} sold</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Sales Chart */}
        <div className="p-4 border-b">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Sales by Hour</h3>
          <div className="space-y-2">
            {mockMetrics.hourlySales.slice(-6).map((hour) => (
              <div key={hour.hour} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-8">
                  {hour.hour > 12 ? `${hour.hour - 12}PM` : `${hour.hour}AM`}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(hour.sales / 600) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-900 font-medium">
                  {formatCurrency(hour.sales)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-4 border-b">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Payment Methods</h3>
          <div className="space-y-2">
            {mockMetrics.paymentMethods.map((method) => (
              <div key={method.method} className="flex items-center justify-between">
                <span className="text-sm text-gray-900">{method.method}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(method.amount)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatPercentage(method.percentage)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        {lowStockProducts && lowStockProducts.length > 0 && (
          <div className="p-4 border-b">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Low Stock Alerts</h3>
            <div className="space-y-2">
              {lowStockProducts.slice(0, 3).map((product: any) => (
                <div key={product._id} className="flex items-center justify-between py-2 px-3 bg-yellow-50 rounded">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-gray-900 truncate">{product.name}</span>
                  </div>
                  <span className="text-xs text-yellow-700 font-medium">
                    {product.stock || 0} left
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">Sale completed</p>
                <p className="text-xs text-gray-500">2 minutes ago • $127.50</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">Customer added</p>
                <p className="text-xs text-gray-500">5 minutes ago • John Doe</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">Product restocked</p>
                <p className="text-xs text-gray-500">8 minutes ago • Wireless Headphones</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t bg-gray-50">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onToggleQueuePanel}
            className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            <Clock className="w-4 h-4 inline mr-1" />
            Held Sales
          </button>
          <button className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
            <Activity className="w-4 h-4 inline mr-1" />
            Full Report
          </button>
        </div>
      </div>
    </div>
  );
}