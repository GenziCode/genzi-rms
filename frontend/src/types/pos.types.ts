/**
 * POS/Sales Types
 * Type definitions for Point of Sale system
 */

export interface Product {
  _id: string;
  name: string;
  price: number;
  cost?: number;
  stock?: number;
  barcode?: string;
  category: string;
  images?: string[];
  unit?: string;
  taxRate?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  price: number; // Can be adjusted price
  discount?: number; // Percentage or fixed amount
  taxAmount?: number;
  subtotal: number;
  total: number;
  note?: string;
}

export interface Payment {
  method: 'cash' | 'card' | 'mobile' | 'bank' | 'credit' | 'other';
  amount: number;
  reference?: string;
  note?: string;
}

export interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  loyaltyPoints?: number;
  creditLimit?: number;
  creditBalance?: number;
  totalSpent?: number;
  totalPurchases?: number;
}

export interface Sale {
  _id: string;
  saleNumber: string;
  storeId: string;
  cashierId: string;
  customerId?: string;
  customer?: Customer;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    taxAmount: number;
    total: number;
  }>;
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  amountPaid: number;
  changeGiven: number;
  payments: Payment[];
  status: 'completed' | 'held' | 'voided' | 'refunded' | 'partial_refund';
  voidReason?: string;
  refundAmount?: number;
  refundReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleRequest {
  storeId: string;
  customerId?: string;
  items: Array<{
    productId: string;
    quantity: number;
    price?: number; // Backend expects 'price', optional
    discount?: number;
    discountType?: 'percentage' | 'fixed';
  }>;
  payments: Payment[];
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  notes?: string;
}

export interface HoldTransactionRequest {
  storeId: string;
  customerId?: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  notes?: string;
}

export interface ResumeTransactionRequest {
  payments: Payment[];
}

export interface VoidSaleRequest {
  reason: string;
}

export interface RefundSaleRequest {
  amount: number;
  reason: string;
  refundMethod?: 'cash' | 'card' | 'mobile' | 'bank' | 'credit' | 'other';
}

export interface SaleQueryParams {
  storeId?: string;
  cashierId?: string;
  customerId?: string;
  status?: 'completed' | 'held' | 'voided' | 'refunded' | 'partial_refund';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface SaleListResponse {
  sales: Sale[];
  total: number;
  page: number;
  totalPages: number;
}

export interface DailySummary {
  date: string;
  storeId?: string;
  totalSales: number;
  totalRevenue: number;
  totalDiscount: number;
  totalTax: number;
  totalCash: number;
  totalCard: number;
  totalMobile: number;
  totalBank: number;
  totalOther: number;
  averageOrderValue: number;
  transactionsCount: number;
  voidedSales: number;
  refundedAmount: number;
}

export interface Store {
  _id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  isActive: boolean;
}
