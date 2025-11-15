import api from '@/lib/api';

export interface StockForecast {
  product: {
    id: string;
    name: string;
    sku: string;
    unit?: string;
  };
  avgDailyDemand: number;
  totalMovement: number;
  onHand: number;
  leadTimeDays: number;
  safetyStockDays: number;
  safetyStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  projectedDaysRemaining: number | null;
  override?: {
    leadTimeDays?: number;
    safetyStockDays?: number;
    notes?: string;
    updatedAt?: string;
  };
}

export interface StockForecastResponse {
  forecasts: StockForecast[];
  metadata: {
    generatedAt: string;
    lookbackDays: number;
    totalProducts: number;
  };
}

export const stockForecastService = {
  async list(params?: {
    storeId?: string;
    lookbackDays?: number;
    minVelocity?: number;
    limit?: number;
  }): Promise<StockForecastResponse> {
    const response = await api.get<{ data: StockForecastResponse }>('/inventory/forecasting', {
      params,
    });
    return response.data.data;
  },

  async updateOverride(
    productId: string,
    payload: { leadTimeDays?: number; safetyStockDays?: number; notes?: string }
  ) {
    const response = await api.put<{ data: unknown }>(
      `/inventory/forecasting/${productId}/override`,
      payload
    );
    return response.data.data;
  },
};

