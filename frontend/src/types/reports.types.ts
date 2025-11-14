/**
 * Reports Types
 * Type definitions for Reports & Analytics
 */

export interface ReportFilters {
  period?: 'today' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
  storeId?: string;
  storeIds?: string[];
  categoryId?: string;
  categoryIds?: string[];
  limit?: number;
}

export interface DashboardReport {
  period: 'today' | 'week' | 'month';
  dateRange: {
    start: string;
    end: string;
  };
  sales: {
    total: number;
    transactions: number;
    items: number;
    tax: number;
    discount: number;
    avgOrderValue: number;
    growth?: number;
  };
  products: {
    total: number;
    lowStock: number;
    outOfStock: number;
  };
  customers: {
    total: number;
    new: number;
  };
  /**
   * Derived/legacy fields used by analytics dashboards.
   * These are optional because not every API payload supplies them,
   * but the UI expects them when available.
   */
  totalSales?: number;
  totalTransactions?: number;
  totalItems?: number;
  avgOrderValue?: number;
  newCustomersCount?: number;
  totalValue?: number;
}

export interface SalesTrend {
  date: string;
  sales: number;
  transactions: number;
  averageOrderValue: number;
  totalSales?: number;
}

export interface SalesTrendsReport {
  trends: SalesTrend[];
  summary: {
    totalSales: number;
    totalTransactions: number;
    averageOrderValue: number;
    growth: number;
  };
}

export interface ProfitLossCategoryBreakdown {
  category: string;
  amount: number;
  total?: number;
  name?: string;
}

export interface ProfitLossReport {
  revenue: {
    sales: number;
    total: number;
  };
  costs: {
    cogs: number;
    total: number;
  };
  profit: {
    gross: number;
    net: number;
    margin: number;
  };
  totalRevenue?: number;
  totalExpenses?: number;
  netProfit?: number;
  expenses?: ProfitLossCategoryBreakdown[];
  revenueByCategory?: ProfitLossCategoryBreakdown[];
}

export interface PaymentMethod {
  method: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface PaymentMethodsReport {
  methods: PaymentMethod[];
  total: number;
}

export interface InventoryCategoryBreakdown {
  categoryId: string;
  categoryName: string;
  products: number;
  quantity: number;
  costValue: number;
  retailValue: number;
  category?: string;
  name?: string;
  totalValue?: number;
  value?: number;
  cost?: number;
  profit?: number;
}

export interface InventoryProductBreakdown {
  productId?: string;
  productName?: string;
  name?: string;
  value?: number;
  totalValue?: number;
  retailValue?: number;
  costValue?: number;
}

export interface InventoryValuationReport {
  totalProducts: number;
  totalQuantity: number;
  costValue: number;
  retailValue: number;
  categories: InventoryCategoryBreakdown[];
  products?: InventoryProductBreakdown[];
  lowStockCount?: number;
  lowStockProducts?: number;
  outOfStockCount?: number;
  outOfStockProducts?: number;
  totalValue?: number;
}

export interface TopProduct {
  _id: string;
  name: string;
  sku?: string;
  totalQuantity: number;
  totalRevenue: number;
  transactionCount: number;
}

export interface CustomerInsight {
  customerId: string;
  customerName: string;
  email?: string;
  totalSpent: number;
  visits: number;
  avgOrderValue: number;
}

export interface CustomerSegmentBreakdown {
  segment: string;
  name?: string;
  count: number;
  total?: number;
}

export interface CustomerInsightsReport {
  period: {
    start: string;
    end: string;
  };
  totalCustomers: number;
  newCustomers: number;
  topCustomers: CustomerInsight[];
  customerSegments?: CustomerSegmentBreakdown[];
  avgOrderValue?: number;
  lifetimeValue?: number;
}

export interface VendorPerformance {
  vendorId: string;
  name: string;
  email?: string;
  phone?: string;
  totalOrders: number;
  totalPurchased: number;
  avgOrderValue: number;
}

export interface VendorPerformanceMetric {
  name: string;
  value: number;
  score?: number;
  metric?: string;
}

export interface VendorPerformanceReport {
  topVendors: VendorPerformance[];
  totalVendors?: number;
  activePurchaseOrders?: number;
  totalPurchased?: number;
  performanceMetrics?: VendorPerformanceMetric[];
  onTimeDeliveryRate?: number;
  qualityScore?: number;
  responseRate?: number;
  totalOrders?: number;
  avgOrderValue?: number;
}
