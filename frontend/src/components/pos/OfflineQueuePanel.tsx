import { useMemo } from 'react';
import { Clock, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useOfflineQueueStore } from '@/store/offlineQueueStore';
import { formatCurrency } from '@/lib/utils';

export function OfflineQueuePanel() {
  const { queue, markSaleStatus, removeSale } = useOfflineQueueStore();

  const grouped = useMemo(() => {
    return {
      syncing: queue.filter((sale) => sale.status === 'syncing'),
      pending: queue.filter((sale) => sale.status === 'pending'),
      failed: queue.filter((sale) => sale.status === 'failed'),
    };
  }, [queue]);

  if (queue.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Offline Sales Queue
          </h3>
          <p className="text-xs text-gray-500">
            Sales will automatically sync when you are online.
          </p>
        </div>
        <Clock className="w-5 h-5 text-gray-400" />
      </div>

      {(['syncing', 'pending', 'failed'] as const).map((status) => {
        const items = grouped[status];
        if (!items.length) return null;

        return (
          <div key={status} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {status === 'pending'
                ? 'Waiting to sync'
                : status === 'syncing'
                  ? 'Syncing'
                  : 'Needs attention'}
            </p>
            <div className="space-y-2">
              {items.map((sale) => (
                <div
                  key={sale.id}
                  className="border border-gray-100 rounded-md p-3 bg-gray-50/80 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">
                        {sale.customerSnapshot?.name ?? 'Walk-in customer'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(sale.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(sale.payload.grandTotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Items: {sale.payload.cart.length} • Payments:{' '}
                      {sale.payload.payments
                        .map((payment) => payment.method)
                        .join(', ')}
                    </span>
                    {status === 'syncing' && (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    )}
                    {status === 'failed' && (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  {sale.errorMessage && (
                    <p className="text-xs text-red-600 border border-red-100 bg-red-50 rounded px-2 py-1">
                      {sale.errorMessage}
                    </p>
                  )}
                  {status === 'failed' && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => markSaleStatus(sale.id, 'pending')}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700"
                      >
                        Retry
                      </button>
                      <button
                        onClick={() => removeSale(sale.id)}
                        className="ml-3 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
