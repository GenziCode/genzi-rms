import type { CartItem, Customer, Payment } from '@/types/pos.types';

export type OfflineSaleStatus = 'pending' | 'syncing' | 'failed' | 'conflict';
export type QueuedSaleType = 'sale' | 'resume_held';

export interface QueuedSale {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: OfflineSaleStatus;
  type: QueuedSaleType;
  errorMessage?: string;
  conflictResolution?: 'overwrite' | 'skip' | 'manual';
  payload: {
    storeId: string;
    customerId?: string;
    cart: CartItem[];
    payments: Payment[];
    notes?: string;
    discount: number;
    cashierId?: string;
    subtotal: number;
    totalTax: number;
    totalDiscount: number;
    grandTotal: number;
    heldSaleId?: string; // For resume_held type
  };
  customerSnapshot?: Customer | null;
  originalHeldSale?: any; // Snapshot of original held sale for conflict resolution
}
