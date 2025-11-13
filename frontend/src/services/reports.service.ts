import api from '@/lib/api';
import type {
  ReportFilters,
  DashboardReport,
  SalesTrendsReport,
  ProfitLossReport,
  PaymentMethodsReport,
  InventoryValuationReport,
  CustomerInsightsReport,
  VendorPerformanceReport,
} from '@/types/reports.types';

export const reportsService = {
  /**
   * Get dashboard KPIs
   * GET /api/reports/dashboard
   */
  async getDashboard(filters?: ReportFilters): Promise<DashboardReport> {
    const response = await api.get<{ data: DashboardReport }>(
      '/reports/dashboard',
      {
        params: { period: filters?.period || 'today' },
      }
    );
    return response.data.data;
  },

  /**
   * Get sales trends
   * GET /api/reports/sales-trends
   */
  async getSalesTrends(filters?: ReportFilters): Promise<SalesTrendsReport> {
    const response = await api.get<{ data: SalesTrendsReport }>(
      '/reports/sales-trends',
      {
        params: filters,
      }
    );
    return response.data.data;
  },

  /**
   * Get top products
   * GET /api/reports/top-products
   */
  async getTopProducts(filters?: ReportFilters) {
    const response = await api.get('/reports/top-products', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Get payment methods breakdown
   * GET /api/reports/payment-methods
   */
  async getPaymentMethods(
    filters?: ReportFilters
  ): Promise<PaymentMethodsReport> {
    const response = await api.get<{ data: PaymentMethodsReport }>(
      '/reports/payment-methods',
      {
        params: filters,
      }
    );
    return response.data.data;
  },

  /**
   * Get profit & loss report
   * GET /api/reports/profit-loss
   */
  async getProfitLoss(filters?: ReportFilters): Promise<ProfitLossReport> {
    const response = await api.get<{ data: ProfitLossReport }>(
      '/reports/profit-loss',
      {
        params: filters,
      }
    );
    return response.data.data;
  },

  /**
   * Get inventory valuation
   * GET /api/reports/inventory-valuation
   */
  async getInventoryValuation(): Promise<InventoryValuationReport> {
    const response = await api.get<{ data: InventoryValuationReport }>(
      '/reports/inventory-valuation'
    );
    return response.data.data;
  },

  /**
   * Get customer insights
   * GET /api/reports/customer-insights
   */
  async getCustomerInsights(
    filters?: ReportFilters
  ): Promise<CustomerInsightsReport> {
    const response = await api.get<{ data: CustomerInsightsReport }>(
      '/reports/customer-insights',
      {
        params: filters,
      }
    );
    return response.data.data;
  },

  /**
   * Get vendor performance
   * GET /api/reports/vendor-performance
   */
  async getVendorPerformance(
    filters?: ReportFilters
  ): Promise<VendorPerformanceReport> {
    const response = await api.get<{ data: VendorPerformanceReport }>(
      '/reports/vendor-performance',
      {
        params: filters,
      }
    );
    return response.data.data;
  },
};
