/**
 * Purchase Order Types
 * Type definitions for Purchase Order Management
 */

export type PurchaseOrderStatus = 'draft' | 'pending' | 'approved' | 'ordered' | 'received' | 'partial' | 'cancelled';

export interface PurchaseOrderItem {
  productId: string;
  productName?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  total: number;
  receivedQuantity?: number;
}

export interface PurchaseOrder {
  _id: string;
  poNumber: string;
  vendorId: string;
  vendorName?: string;
  vendorCompany?: string;
  storeId: string;
  storeName?: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  shippingCost: number;
  grandTotal: number;
  total?: number; // Alias for grandTotal
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDate?: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  paymentTerms?: string;
  paymentStatus?: 'pending' | 'partial' | 'paid';
  paidAmount?: number;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  receivedBy?: string;
  receivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseOrderRequest {
  vendorId: string;
  storeId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    tax?: number;
  }>;
  expectedDeliveryDate?: string;
  paymentTerms?: string;
  shippingCost?: number;
  notes?: string;
}

export interface UpdatePurchaseOrderRequest {
  items?: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    tax?: number;
  }>;
  expectedDeliveryDate?: string;
  paymentTerms?: string;
  shippingCost?: number;
  notes?: string;
  status?: PurchaseOrderStatus;
}

export interface ReceivePurchaseOrderRequest {
  items: Array<{
    productId: string;
    receivedQuantity: number;
  }>;
  receivedDate?: string;
  notes?: string;
}

export interface PurchaseOrderFilters {
  vendorId?: string;
  storeId?: string;
  status?: PurchaseOrderStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PurchaseOrderListResponse {
  purchaseOrders: PurchaseOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PurchaseOrderStats {
  totalPOs: number;
  totalPOsChange: number;
  totalValue: number;
  totalValueChange: number;
  pendingPOs: number;
  pendingPOsChange: number;
  completedPOs: number;
  completedPOsChange: number;
  statusDistribution: Array<{
    status: string;
    count: number;
    value: number;
  }>;
  trendData: Array<{
    date: string;
    orders: number;
    value: number;
  }>;
  topVendors: Array<{
    vendorName: string;
    orders: number;
    value: number;
  }>;
  alerts?: Array<{
    title: string;
    message: string;
  }>;
}

