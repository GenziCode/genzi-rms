import type { CartItem, Customer, Payment } from '@/types/pos.types';

export type OfflineSaleStatus = 'pending' | 'syncing' | 'failed';

export interface QueuedSale {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: OfflineSaleStatus;
  errorMessage?: string;
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
  };
  customerSnapshot?: Customer | null;
}
