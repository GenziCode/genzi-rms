/**
 * Inventory Types
 * Type definitions for Inventory Management
 */

export interface InventoryStatus {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalStock: number;
}

export interface InventoryValuation {
  totalValue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  byCategory: Array<{
    category: string;
    categoryName: string;
    value: number;
    cost: number;
    profit: number;
    itemCount: number;
  }>;
}

export interface StockMovement {
  _id: string;
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  type:
    | 'sale'
    | 'adjustment'
    | 'transfer_in'
    | 'transfer_out'
    | 'return'
    | 'damage'
    | 'restock'
    | 'initial';
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  reason?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface StockAlert {
  _id: string;
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  type: 'low_stock' | 'out_of_stock' | 'overstock';
  currentStock: number;
  minStock?: number;
  maxStock?: number;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface LowStockProduct {
  _id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minStock: number;
  reorderPoint?: number;
  lastSold?: string;
}

export interface AdjustStockRequest {
  productId: string;
  storeId: string;
  quantity: number; // Positive or negative
  type: 'adjustment' | 'restock' | 'damage' | 'return' | 'initial';
  reason?: string;
  notes?: string;
}

export interface TransferStockRequest {
  productId: string;
  fromStoreId: string;
  toStoreId: string;
  quantity: number;
  reason?: string;
  notes?: string;
}

export interface TransferStockResponse {
  transferOut: StockMovement;
  transferIn: StockMovement;
}

export interface InventoryQueryParams {
  storeId?: string;
  productId?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
