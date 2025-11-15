import api from '@/lib/api';

export interface AgingBucket {
  _id: string;
  products: Array<{
    name: string;
    sku: string;
    currentStock: number;
    daysSinceMovement: number;
  }>;
  totalUnits: number;
  count: number;
}

export interface TurnoverEntry {
  productId: string;
  turnover: number;
}

export interface CongestionEntry {
  _id: {
    store: string;
    type: string;
  };
  count: number;
}

export const stockAnalyticsService = {
  async getAging(params?: {
    storeId?: string;
    categoryId?: string;
  }): Promise<AgingBucket[]> {
    const response = await api.get<{ data: AgingBucket[] }>('/inventory/analytics/aging', {
      params,
    });
    return response.data.data;
  },

  async getTurnover(params?: {
    storeId?: string;
    lookbackDays?: number;
    limit?: number;
  }): Promise<TurnoverEntry[]> {
    const response = await api.get<{ data: TurnoverEntry[] }>('/inventory/analytics/turnover', {
      params,
    });
    return response.data.data;
  },

  async getCongestion(params?: {
    storeId?: string;
    lookbackDays?: number;
  }): Promise<CongestionEntry[]> {
    const response = await api.get<{ data: CongestionEntry[] }>(
      '/inventory/analytics/congestion',
      { params }
    );
    return response.data.data;
  },
};

