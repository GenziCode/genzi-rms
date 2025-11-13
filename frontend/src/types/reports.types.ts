/**
 * Reports Types
 * Type definitions for Reports & Analytics
 */

export interface ReportFilters {
  period?: 'today' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
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
}

export interface SalesTrend {
  date: string;
  sales: number;
  transactions: number;
  averageOrderValue: number;
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

export interface InventoryValuationReport {
  totalProducts: number;
  totalQuantity: number;
  costValue: number;
  retailValue: number;
  categories: Array<{
    categoryId: string;
    categoryName: string;
    products: number;
    quantity: number;
    costValue: number;
    retailValue: number;
  }>;
}

export interface CustomerInsight {
  customerId: string;
  customerName: string;
  email?: string;
  totalSpent: number;
  visits: number;
  avgOrderValue: number;
}

export interface CustomerInsightsReport {
  period: {
    start: string;
    end: string;
  };
  totalCustomers: number;
  newCustomers: number;
  topCustomers: CustomerInsight[];
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

export interface VendorPerformanceReport {
  topVendors: VendorPerformance[];
  totalVendors?: number;
  activePurchaseOrders?: number;
  totalPurchased?: number;
}
