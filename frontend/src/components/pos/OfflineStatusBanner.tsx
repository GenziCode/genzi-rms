import { WifiOff, RefreshCcw } from 'lucide-react';
import { useOfflineQueueStore } from '@/store/offlineQueueStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface OfflineStatusBannerProps {
  onRetry?: () => void;
}

export function OfflineStatusBanner({ onRetry }: OfflineStatusBannerProps) {
  const { isOnline } = useNetworkStatus();
  const { queue } = useOfflineQueueStore();
  const failedCount = queue.filter((sale) => sale.status === 'failed').length;

  if (isOnline && queue.length === 0) {
    return null;
  }

  return (
    <div
      className={`flex items-center justify-between rounded-lg px-4 py-3 mb-4 border ${
        isOnline ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
      }`}
    >
      <div className="flex items-center gap-3 text-sm">
        <WifiOff
          className={`w-5 h-5 ${isOnline ? 'text-amber-600' : 'text-red-600'}`}
        />
        <div className="space-y-0.5">
          <p
            className={`font-medium ${
              isOnline ? 'text-amber-700' : 'text-red-700'
            }`}
          >
            {isOnline ? 'Back online' : 'You are working offline'}
          </p>
          <p className="text-gray-600">
            {isOnline
              ? failedCount > 0
                ? 'Some offline sales need manual review.'
                : 'Queued sales are syncing in the background.'
              : 'New sales will be queued and synced automatically when connection restores.'}
          </p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <RefreshCcw className="w-4 h-4" />
          Retry Sync
        </button>
      )}
    </div>
  );
}
