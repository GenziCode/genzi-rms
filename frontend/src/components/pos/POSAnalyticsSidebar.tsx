import { useMemo } from 'react';
import {
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Activity,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineQueueStore } from '@/store/offlineQueueStore';
import { usePOSStore } from '@/store/posStore';
import { usePOSSessionStore } from '@/store/posSessionStore';
import { formatCurrency } from '@/lib/utils';

interface POSAnalyticsSidebarProps {
  onToggleQueuePanel?: () => void;
}

export default function POSAnalyticsSidebar({ onToggleQueuePanel }: POSAnalyticsSidebarProps) {
  const { user } = useAuthStore();
  const { isOnline } = useNetworkStatus();
  const { queue, getPendingSales, getFailedSales, getHeldTransactionSales } = useOfflineQueueStore();
  const { cart, getSubtotal, getTotalDiscount, getGrandTotal } = usePOSStore();
  const { session } = usePOSSessionStore();

  const sessionData = session;

  const pendingSales = getPendingSales();
  const failedSales = getFailedSales();

  const currentCartValue = getGrandTotal();
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const formatTime = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeSinceLastSale = () => {
    if (!sessionData.lastSaleTime) return 'No sales yet';
    const lastSale = new Date(sessionData.lastSaleTime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSale.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const hours = Math.floor(diffMinutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">POS Analytics</h3>
          </div>
          <div className="flex items-center gap-1">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Cashier: {user?.firstName} {user?.lastName}
        </p>
      </div>

      {/* Current Cart */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Current Cart</span>
          <span className="text-xs text-gray-500">{cartItemCount} items</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(currentCartValue)}
          </span>
          {cart.length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              Active
            </span>
          )}
        </div>
      </div>

      {/* Session KPIs */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Session Performance
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-medium">Sales</p>
                  <p className="text-lg font-bold text-blue-900">
                    {sessionData.salesCount}
                  </p>
                </div>
                <DollarSign className="w-5 h-5 text-blue-500" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600 font-medium">Revenue</p>
                  <p className="text-sm font-bold text-green-900">
                    {formatCurrency(sessionData.totalRevenue)}
                  </p>
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-600 font-medium">Avg Order</p>
                  <p className="text-sm font-bold text-purple-900">
                    {formatCurrency(sessionData.averageOrderValue)}
                  </p>
                </div>
                <Users className="w-5 h-5 text-purple-500" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-orange-600 font-medium">Items Sold</p>
                  <p className="text-lg font-bold text-orange-900">
                    {sessionData.totalItemsSold}
                  </p>
                </div>
                <Activity className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Sync Status */}
        <div>
          <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Sync Status
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Network</span>
              <div className="flex items-center gap-1">
                {isOnline ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600">Offline</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Last Sync</span>
              <span className="text-sm text-gray-900">
                {sessionData.lastSaleTime ? formatTime(sessionData.lastSaleTime) : 'Never'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Session Time</span>
              <span className="text-sm text-gray-900">
                {formatTime(sessionData.sessionStart)}
              </span>
            </div>
          </div>
        </div>

        {/* Offline Queue */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Offline Queue
            </h4>
            <button
              onClick={onToggleQueuePanel}
              className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
            >
              View All
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                Pending
              </span>
              <span className="text-sm font-medium text-yellow-700">
                {pendingSales.length}
              </span>
            </div>

            {getHeldTransactionSales().length > 0 && (
              <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Held Resumes
                </span>
                <span className="text-sm font-medium text-purple-700">
                  {getHeldTransactionSales().length}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Failed
              </span>
              <span className="text-sm font-medium text-red-700">
                {failedSales.length}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
              <span className="text-sm text-gray-600">Total Queued</span>
              <span className="text-sm font-medium text-blue-700">
                {queue.length}
              </span>
            </div>
          </div>

          {failedSales.length > 0 && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-700">
                {failedSales.length} failed sync{failedSales.length > 1 ? 's' : ''}.
                Check queue for details.
              </p>
            </div>
          )}
        </div>

        {/* Last Activity */}
        <div>
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Last Activity</h4>
          <div className="text-sm text-gray-600">
            <p>Last sale: {getTimeSinceLastSale()}</p>
            <p className="mt-1">Session started: {formatTime(sessionData.sessionStart)}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          POS Session Active
        </div>
      </div>
    </div>
  );
}
