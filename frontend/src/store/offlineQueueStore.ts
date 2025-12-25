import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { differenceInMinutes } from 'date-fns';
import type { QueuedSale, OfflineSaleStatus, QueuedSaleType } from '@/types/offline.types';
import type { CartItem, Customer, Payment } from '@/types/pos.types';

interface EnqueueSaleArgs {
  storeId: string;
  customer?: Customer | null;
  cart: CartItem[];
  payments: Payment[];
  notes?: string;
  discount: number;
  cashierId?: string;
  subtotal: number;
  totalTax: number;
  totalDiscount: number;
  grandTotal: number;
}

interface EnqueueHeldSaleArgs extends EnqueueSaleArgs {
  heldSaleId: string;
  originalHeldSale?: any;
}

interface OfflineQueueState {
  queue: QueuedSale[];
  enqueueSale: (sale: EnqueueSaleArgs, errorMessage?: string) => QueuedSale;
  enqueueHeldSale: (sale: EnqueueHeldSaleArgs, errorMessage?: string) => QueuedSale;
  markSaleStatus: (
    id: string,
    status: OfflineSaleStatus,
    errorMessage?: string
  ) => void;
  resolveConflict: (id: string, resolution: 'overwrite' | 'skip' | 'manual') => void;
  removeSale: (id: string) => void;
  clearQueue: () => void;
  getNextPending: () => QueuedSale | undefined;
  getPendingSales: () => QueuedSale[];
  getFailedSales: () => QueuedSale[];
  getConflictedSales: () => QueuedSale[];
  getHeldTransactionSales: () => QueuedSale[];
  hydrateFromLegacyCart: (cart: CartItem[]) => void;
  retryFailedSales: () => void;
}

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      queue: [],

      enqueueSale: (sale, errorMessage) => {
        const now = new Date().toISOString();
        const queued: QueuedSale = {
          id: `offline_${nanoid(12)}`,
          createdAt: now,
          updatedAt: now,
          status: 'pending',
          type: 'sale',
          errorMessage,
          payload: {
            storeId: sale.storeId,
            customerId: sale.customer?._id,
            cart: sale.cart,
            payments: sale.payments,
            notes: sale.notes,
            discount: sale.discount,
            cashierId: sale.cashierId,
            subtotal: sale.subtotal,
            totalTax: sale.totalTax,
            totalDiscount: sale.totalDiscount,
            grandTotal: sale.grandTotal,
          },
          customerSnapshot: sale.customer ?? null,
        };

        set((state) => ({
          queue: [queued, ...state.queue],
        }));

        return queued;
      },

      enqueueHeldSale: (sale, errorMessage) => {
        const now = new Date().toISOString();
        const queued: QueuedSale = {
          id: `offline_held_${nanoid(12)}`,
          createdAt: now,
          updatedAt: now,
          status: 'pending',
          type: 'resume_held',
          errorMessage,
          payload: {
            storeId: sale.storeId,
            customerId: sale.customer?._id,
            cart: sale.cart,
            payments: sale.payments,
            notes: sale.notes,
            discount: sale.discount,
            cashierId: sale.cashierId,
            subtotal: sale.subtotal,
            totalTax: sale.totalTax,
            totalDiscount: sale.totalDiscount,
            grandTotal: sale.grandTotal,
            heldSaleId: sale.heldSaleId,
          },
          customerSnapshot: sale.customer ?? null,
          originalHeldSale: sale.originalHeldSale,
        };

        set((state) => ({
          queue: [queued, ...state.queue],
        }));

        return queued;
      },

      markSaleStatus: (id, status, errorMessage) => {
        set((state) => ({
          queue: state.queue.map((queued) =>
            queued.id === id
              ? {
                  ...queued,
                  status,
                  errorMessage,
                  updatedAt: new Date().toISOString(),
                }
              : queued
          ),
        }));
      },

      resolveConflict: (id, resolution) => {
        set((state) => ({
          queue: state.queue.map((queued) =>
            queued.id === id
              ? {
                  ...queued,
                  conflictResolution: resolution,
                  status: resolution === 'manual' ? 'conflict' : 'pending',
                  updatedAt: new Date().toISOString(),
                }
              : queued
          ),
        }));
      },

      removeSale: (id) => {
        set((state) => ({
          queue: state.queue.filter((queued) => queued.id !== id),
        }));
      },

      clearQueue: () => {
        set({ queue: [] });
      },

      getNextPending: () => {
        return get().queue.find((queued) => queued.status === 'pending');
      },

      getPendingSales: () => {
        return get().queue.filter((queued) => queued.status === 'pending' || queued.status === 'syncing');
      },

      getFailedSales: () => {
        return get().queue.filter((queued) => queued.status === 'failed');
      },

      getConflictedSales: () => {
        return get().queue.filter((queued) => queued.status === 'conflict');
      },

      getHeldTransactionSales: () => {
        return get().queue.filter((queued) => queued.type === 'resume_held');
      },

      retryFailedSales: () => {
        set((state) => ({
          queue: state.queue.map((queued) =>
            queued.status === 'failed'
              ? {
                  ...queued,
                  status: 'pending' as OfflineSaleStatus,
                  errorMessage: undefined,
                  updatedAt: new Date().toISOString(),
                }
              : queued
          ),
        }));
      },

      hydrateFromLegacyCart: (cart) => {
        // guard against legacy persisted carts older than an hour
        const persisted = get().queue;
        if (!persisted.length) return;

        const newest = persisted[0];
        if (
          newest &&
          differenceInMinutes(new Date(), new Date(newest.createdAt)) > 60
        ) {
          set({ queue: [] });
          return;
        }

        if (cart.length === 0) return;

        // no-op: hydration handled elsewhere, method reserved for future use
      },
    }),
    {
      name: 'pos-offline-queue',
      version: 1,
    }
  )
);
