import api from '@/lib/api';

export interface DailySalesSummary {
  dailyData: Array<{
    date: string;
    totalSales: number;
    totalTransactions: number;
    totalItems: number;
    totalTax: number;
    totalDiscount: number;
    totalCost: number;
    avgTransactionValue: number;
  }>;
  summary: {
    totalSales: number;
    totalTransactions: number;
    totalItems: number;
    totalTax: number;
    totalDiscount: number;
    totalCost: number;
    avgTransactionValue: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface WeeklySalesReport {
  weeklyData: Array<{
    week: string;
    totalSales: number;
    totalTransactions: number;
    totalItems: number;
    totalTax: number;
    totalDiscount: number;
    avgTransactionValue: number;
  }>;
  summary: {
    totalSales: number;
    totalTransactions: number;
    totalItems: number;
    totalTax: number;
    totalDiscount: number;
    avgTransactionValue: number;
  };
  comparison: {
    previousWeek: {
      totalSales: number;
      totalTransactions: number;
    };
    salesChange: number;
    salesChangePercent: number;
    transactionsChange: number;
    transactionsChangePercent: number;
  };
  dateRange: {
    weekStart: string;
    weekEnd: string;
  };
}

export interface MonthlySalesReport {
  dailyData: Array<{
    date: string;
    totalSales: number;
    totalTransactions: number;
    totalItems: number;
    avgTransactionValue: number;
  }>;
  summary: {
    totalSales: number;
    totalTransactions: number;
    totalItems: number;
    totalTax: number;
    totalDiscount: number;
    avgTransactionValue: number;
  };
  comparison: {
    previousYear: {
      totalSales: number;
      totalTransactions: number;
    };
    salesChange: number;
    salesChangePercent: number;
    transactionsChange: number;
    transactionsChangePercent: number;
  };
  month: {
    year: number;
    month: number;
  };
}

export interface SalesByProduct {
  products: Array<{
    productId: string;
    productName: string;
    product?: any;
    totalQuantity: number;
    totalRevenue: number;
    totalCost: number;
    avgUnitPrice: number;
    transactionCount: number;
    profit: number;
    profitMargin: number;
  }>;
  summary: {
    totalProducts: number;
    totalQuantity: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface SalesByCategory {
  categories: Array<{
    categoryId: string;
    categoryName: string;
    totalQuantity: number;
    totalRevenue: number;
    totalCost: number;
    productCount: number;
    profit: number;
    profitMargin: number;
  }>;
  summary: {
    totalCategories: number;
    totalQuantity: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface SalesByStore {
  stores: Array<{
    storeId: string;
    store?: any;
    totalSales: number;
    totalTransactions: number;
    totalItems: number;
    totalTax: number;
    totalDiscount: number;
    avgTransactionValue: number;
  }>;
  summary: {
    totalStores: number;
    totalSales: number;
    totalTransactions: number;
    totalItems: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface SalesByEmployee {
  employees: Array<{
    employeeId: string;
    employee?: any;
    totalSales: number;
    totalTransactions: number;
    totalItems: number;
    avgTransactionValue: number;
    totalDiscount: number;
    itemsPerTransaction: number;
  }>;
  summary: {
    totalEmployees: number;
    totalSales: number;
    totalTransactions: number;
    avgSalesPerEmployee: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface SalesByCustomer {
  customers: Array<{
    customerId: string;
    customer?: any;
    totalSales: number;
    totalTransactions: number;
    totalItems: number;
    avgTransactionValue: number;
    lastPurchaseDate: string;
    firstPurchaseDate: string;
    daysSinceLastPurchase: number;
  }>;
  summary: {
    totalCustomers: number;
    totalSales: number;
    totalTransactions: number;
    avgSalesPerCustomer: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface SalesComparison {
  period1: {
    totalSales: number;
    totalTransactions: number;
    totalItems: number;
    totalTax: number;
    totalDiscount: number;
    avgTransactionValue: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
  period2: {
    totalSales: number;
    totalTransactions: number;
    totalItems: number;
    totalTax: number;
    totalDiscount: number;
    avgTransactionValue: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
  comparison: {
    salesChange: number;
    salesChangePercent: number;
    transactionsChange: number;
    transactionsChangePercent: number;
    itemsChange: number;
    itemsChangePercent: number;
    avgTransactionChange: number;
    avgTransactionChangePercent: number;
  };
}

export interface TopSellingProducts {
  products: Array<{
    productId: string;
    productName: string;
    product?: any;
    rank: number;
    totalQuantity: number;
    totalRevenue: number;
    avgUnitPrice: number;
    transactionCount: number;
  }>;
  summary: {
    totalProducts: number;
    totalQuantity: number;
    totalRevenue: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
  filters: {
    limit: number;
    sortBy: 'revenue' | 'quantity' | 'transactions';
  };
}

export const salesReportsService = {
  /**
   * Daily Sales Summary Report
   * GET /api/reports/sales/daily-summary
   */
  async getDailySalesSummary(filters?: {
    startDate?: string;
    endDate?: string;
    storeId?: string;
  }): Promise<DailySalesSummary> {
    const response = await api.get<{ data: DailySalesSummary }>('/reports/sales/daily-summary', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Weekly Sales Report
   * GET /api/reports/sales/weekly
   */
  async getWeeklySales(filters?: {
    weekStart?: string;
    weekEnd?: string;
    storeId?: string;
  }): Promise<WeeklySalesReport> {
    const response = await api.get<{ data: WeeklySalesReport }>('/reports/sales/weekly', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Monthly Sales Report
   * GET /api/reports/sales/monthly
   */
  async getMonthlySales(filters?: {
    month?: number;
    year?: number;
    storeId?: string;
  }): Promise<MonthlySalesReport> {
    const response = await api.get<{ data: MonthlySalesReport }>('/reports/sales/monthly', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Sales by Product Report
   * GET /api/reports/sales/by-product
   */
  async getSalesByProduct(filters?: {
    startDate?: string;
    endDate?: string;
    productId?: string;
    storeId?: string;
  }): Promise<SalesByProduct> {
    const response = await api.get<{ data: SalesByProduct }>('/reports/sales/by-product', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Sales by Category Report
   * GET /api/reports/sales/by-category
   */
  async getSalesByCategory(filters?: {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    storeId?: string;
  }): Promise<SalesByCategory> {
    const response = await api.get<{ data: SalesByCategory }>('/reports/sales/by-category', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Sales by Store Report
   * GET /api/reports/sales/by-store
   */
  async getSalesByStore(filters?: {
    startDate?: string;
    endDate?: string;
    storeIds?: string[];
  }): Promise<SalesByStore> {
    const response = await api.get<{ data: SalesByStore }>('/reports/sales/by-store', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Sales by Employee Report
   * GET /api/reports/sales/by-employee
   */
  async getSalesByEmployee(filters?: {
    startDate?: string;
    endDate?: string;
    employeeId?: string;
    storeId?: string;
  }): Promise<SalesByEmployee> {
    const response = await api.get<{ data: SalesByEmployee }>('/reports/sales/by-employee', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Sales by Customer Report
   * GET /api/reports/sales/by-customer
   */
  async getSalesByCustomer(filters?: {
    startDate?: string;
    endDate?: string;
    customerId?: string;
    storeId?: string;
    limit?: number;
  }): Promise<SalesByCustomer> {
    const response = await api.get<{ data: SalesByCustomer }>('/reports/sales/by-customer', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Sales Comparison Report
   * GET /api/reports/sales/comparison
   */
  async getSalesComparison(filters: {
    period1Start: string;
    period1End: string;
    period2Start: string;
    period2End: string;
    storeId?: string;
  }): Promise<SalesComparison> {
    const response = await api.get<{ data: SalesComparison }>('/reports/sales/comparison', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Top Selling Products Report
   * GET /api/reports/sales/top-products
   */
  async getTopSellingProducts(filters?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    sortBy?: 'revenue' | 'quantity' | 'transactions';
    storeId?: string;
  }): Promise<TopSellingProducts> {
    const response = await api.get<{ data: TopSellingProducts }>('/reports/sales/top-products', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Bottom Selling Products Report
   * GET /api/reports/sales/bottom-products
   */
  async getBottomSellingProducts(filters?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    sortBy?: 'revenue' | 'quantity' | 'transactions';
    storeId?: string;
  }): Promise<TopSellingProducts> {
    const response = await api.get<{ data: TopSellingProducts }>('/reports/sales/bottom-products', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Sales Trend Analysis Report
   * GET /api/reports/sales/trend-analysis
   */
  async getSalesTrendAnalysis(filters?: {
    startDate?: string;
    endDate?: string;
    period?: 'day' | 'week' | 'month';
    storeId?: string;
  }): Promise<any> {
    const response = await api.get('/reports/sales/trend-analysis', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Discount Analysis Report
   * GET /api/reports/sales/discount-analysis
   */
  async getDiscountAnalysis(filters?: {
    startDate?: string;
    endDate?: string;
    storeId?: string;
  }): Promise<any> {
    const response = await api.get('/reports/sales/discount-analysis', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Return/Refund Report
   * GET /api/reports/sales/returns-refunds
   */
  async getReturnRefundReport(filters?: {
    startDate?: string;
    endDate?: string;
    storeId?: string;
  }): Promise<any> {
    const response = await api.get('/reports/sales/returns-refunds', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Sales Forecast Report
   * GET /api/reports/sales/forecast
   */
  async getSalesForecast(filters?: {
    forecastDays?: number;
    storeId?: string;
  }): Promise<any> {
    const response = await api.get('/reports/sales/forecast', {
      params: filters,
    });
    return response.data.data;
  },
};

