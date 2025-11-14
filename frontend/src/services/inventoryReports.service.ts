import api from '@/lib/api';

export interface CurrentStockStatus {
  products: Array<{
    productId: string;
    productName: string;
    sku: string;
    category: string;
    currentStock: number;
    minStock: number;
    maxStock: number;
    reorderPoint: number;
    unitCost: number;
    totalValue: number;
    status: 'in_stock' | 'low_stock' | 'out_of_stock';
  }>;
  summary: {
    totalProducts: number;
    totalQuantity: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalValue: number;
  };
}

export interface LowStockAlert {
  products: Array<{
    productId: string;
    productName: string;
    sku: string;
    category: string;
    currentStock: number;
    reorderPoint: number;
    reorderQuantity: number;
    unitCost: number;
    daysOutOfStock: number;
    urgency: 'critical' | 'high' | 'medium';
  }>;
  summary: {
    totalLowStock: number;
    critical: number;
    high: number;
    medium: number;
  };
}

export interface OverstockReport {
  products: Array<{
    productId: string;
    productName: string;
    sku: string;
    category: string;
    currentStock: number;
    maxStock: number;
    excessStock: number;
    unitCost: number;
    excessValue: number;
    excessPercentage: number;
  }>;
  summary: {
    totalOverstock: number;
    totalExcessQuantity: number;
    totalExcessValue: number;
  };
}

export interface StockMovement {
  movements: Array<{
    date: string;
    type: 'in' | 'out' | 'adjustment';
    reference: string;
    productId: string;
    productName: string;
    quantity: number;
    unitCost?: number;
    unitPrice?: number;
    totalCost?: number;
    totalValue?: number;
  }>;
  summary: {
    totalMovements: number;
    stockIn: number;
    stockOut: number;
    netMovement: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface StockValuation {
  valuation: Array<{
    productId: string;
    productName: string;
    sku: string;
    category: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    unitPrice: number;
    totalValue: number;
    profitPotential: number;
    profitMargin: number;
  }>;
  summary: {
    totalProducts: number;
    totalQuantity: number;
    totalCostValue: number;
    totalRetailValue: number;
    totalProfitPotential: number;
    averageProfitMargin: number;
  };
}

export const inventoryReportsService = {
  /**
   * Current Stock Status Report
   * GET /api/reports/inventory/current-stock
   */
  async getCurrentStockStatus(filters?: {
    storeId?: string;
    categoryId?: string;
    lowStockOnly?: boolean;
    outOfStockOnly?: boolean;
  }): Promise<CurrentStockStatus> {
    const response = await api.get<{ data: CurrentStockStatus }>('/reports/inventory/current-stock', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Low Stock Alert Report
   * GET /api/reports/inventory/low-stock
   */
  async getLowStockAlert(filters?: {
    storeId?: string;
    categoryId?: string;
  }): Promise<LowStockAlert> {
    const response = await api.get<{ data: LowStockAlert }>('/reports/inventory/low-stock', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Overstock Report
   * GET /api/reports/inventory/overstock
   */
  async getOverstockReport(filters?: {
    storeId?: string;
    categoryId?: string;
  }): Promise<OverstockReport> {
    const response = await api.get<{ data: OverstockReport }>('/reports/inventory/overstock', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Stock Movement Report
   * GET /api/reports/inventory/stock-movement
   */
  async getStockMovement(filters?: {
    startDate?: string;
    endDate?: string;
    productId?: string;
    storeId?: string;
    movementType?: 'in' | 'out' | 'adjustment';
  }): Promise<StockMovement> {
    const response = await api.get<{ data: StockMovement }>('/reports/inventory/stock-movement', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Stock Valuation Report
   * GET /api/reports/inventory/stock-valuation
   */
  async getStockValuation(filters?: {
    storeId?: string;
    categoryId?: string;
    valuationMethod?: 'fifo' | 'average' | 'lifo';
  }): Promise<StockValuation> {
    const response = await api.get<{ data: StockValuation }>('/reports/inventory/stock-valuation', {
      params: filters,
    });
    return response.data.data;
  },
};

