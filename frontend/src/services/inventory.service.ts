import api from '@/lib/api';
import type {
  InventoryStatus,
  InventoryValuation,
  StockMovement,
  StockAlert,
  LowStockProduct,
  AdjustStockRequest,
  TransferStockRequest,
  TransferStockResponse,
  InventoryQueryParams,
} from '@/types/inventory.types';

export const inventoryService = {
  /**
   * Get inventory status summary
   * GET /api/inventory/status
   */
  async getStatus(storeId?: string) {
    const params = storeId ? { storeId } : {};
    const response = await api.get<{ data: InventoryStatus }>(
      '/inventory/status',
      { params }
    );
    return response.data.data;
  },

  /**
   * Get inventory valuation
   * GET /api/inventory/valuation
   */
  async getValuation(storeId?: string) {
    const params = storeId ? { storeId } : {};
    const response = await api.get<{ data: InventoryValuation }>(
      '/inventory/valuation',
      { params }
    );
    return response.data.data;
  },

  /**
   * Get low stock products
   * GET /api/inventory/low-stock
   */
  async getLowStock(storeId?: string) {
    const params = storeId ? { storeId } : {};
    const response = await api.get<{ data: LowStockProduct[] }>(
      '/inventory/low-stock',
      { params }
    );
    return response.data.data;
  },

  /**
   * Get stock movements
   * GET /api/inventory/movements
   */
  async getMovements(params?: InventoryQueryParams) {
    const response = await api.get<{
      data: {
        movements: StockMovement[];
        total: number;
        page: number;
        totalPages: number;
      };
    }>('/inventory/movements', { params });
    return response.data.data;
  },

  /**
   * Get active alerts
   * GET /api/inventory/alerts
   */
  async getAlerts(params?: InventoryQueryParams) {
    const response = await api.get<{ data: StockAlert[] }>(
      '/inventory/alerts',
      { params }
    );
    return response.data.data;
  },

  /**
   * Adjust stock
   * POST /api/inventory/adjust
   */
  async adjustStock(data: AdjustStockRequest) {
    const response = await api.post<{ data: StockMovement }>(
      '/inventory/adjust',
      data
    );
    return response.data.data;
  },

  /**
   * Transfer stock between stores
   * POST /api/inventory/transfer
   */
  async transferStock(data: TransferStockRequest) {
    const response = await api.post<{ data: TransferStockResponse }>(
      '/inventory/transfer',
      data
    );
    return response.data.data;
  },

  /**
   * Acknowledge alert
   * POST /api/inventory/alerts/:id/acknowledge
   */
  async acknowledgeAlert(alertId: string) {
    const response = await api.post<{ data: StockAlert }>(
      `/inventory/alerts/${alertId}/acknowledge`
    );
    return response.data.data;
  },
};
