import { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useNetworkStatus } from './useNetworkStatus';
import { useOfflineQueueStore } from '@/store/offlineQueueStore';
import { posService } from '@/services/pos.service';
import type { Payment } from '@/types/pos.types';

interface SyncOptions {
  enabled?: boolean;
  storeIdFallback: string;
}

export function useOfflineSync(options: SyncOptions) {
  const { enabled = true, storeIdFallback } = options;
  const { isOnline } = useNetworkStatus();
  const { queue, markSaleStatus, removeSale, getNextPending } =
    useOfflineQueueStore();
  const isSyncing = useRef(false);

  useEffect(() => {
    if (!enabled || !isOnline || isSyncing.current) {
      return;
    }

    const runSync = async () => {
      isSyncing.current = true;

      try {
        let next = getNextPending();

        while (next) {
          markSaleStatus(next.id, 'syncing');

          const payload = next.payload;

          try {
            if (next.type === 'resume_held' && payload.heldSaleId) {
              // This is a held transaction resume
              await posService.resumeTransaction(payload.heldSaleId, {
                payments: payload.payments as Payment[],
              });
              toast.success('Offline held transaction resume synced successfully');
            } else {
              // This is a regular sale
              await posService.createSale({
                storeId: payload.storeId || storeIdFallback,
                customerId: payload.customerId,
                notes: payload.notes,
                discount: payload.discount,
                items: payload.cart.map((item) => ({
                  productId: item.product._id,
                  quantity: item.quantity,
                  price: item.price,
                  discount: item.discount ?? 0,
                  discountType: 'fixed',
                })),
                payments: payload.payments as Payment[],
              });
              toast.success('Offline sale synced successfully');
            }

            removeSale(next.id);
          } catch (error) {
            const message =
              (error as { response?: { data?: { message?: string } } })
                ?.response?.data?.message ?? 'Sync failed';
            markSaleStatus(next.id, 'failed', message);
            toast.error(`Failed to sync offline sale: ${message}`);
            break;
          }

          next = getNextPending();
        }
      } finally {
        isSyncing.current = false;
      }
    };

    if (queue.some((sale) => sale.status === 'pending')) {
      runSync();
    }
  }, [
    enabled,
    getNextPending,
    isOnline,
    markSaleStatus,
    queue,
    removeSale,
    storeIdFallback,
  ]);

  return { isOnline, queue };
}
