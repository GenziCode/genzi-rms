import api from '@/lib/api';

export interface TenantUsageResponse {
  tenant: {
    id: string;
    name: string;
    status: string;
    plan: string;
    billingCycle: string;
    suspendedAt?: string;
    suspendReason?: string;
    features: Record<string, boolean>;
  };
  limits: {
    users: number;
    stores: number;
    products: number;
    monthlyTransactions: number;
    storageBytes: number;
  };
  usage: {
    seats: {
      used: number;
      limit: number;
      percent: number;
      byRole: Array<{
        role: string;
        count: number;
      }>;
    };
    stores: {
      used: number;
      active: number;
      inactive: number;
      limit: number;
      percent: number;
    };
    products: {
      used: number;
      limit: number;
      percent: number;
    };
    monthlyTransactions: {
      count: number;
      totalAmount: number;
      totalTax: number;
      limit: number;
      percent: number;
      periodStart: string;
    };
    storage: {
      usedBytes: number;
      limitBytes: number;
      percent: number;
    };
  };
  sync: {
    deviceCount: number;
    online: number;
    offline: number;
    degraded: number;
    conflicts: number;
    latestSyncAt?: string;
    devices: Array<{
      id: string;
      label?: string;
      status: 'online' | 'offline' | 'degraded';
      lastSyncAt?: string;
      lastSeenAt?: string;
      queueSize?: number;
      conflicts?: number;
      appVersion?: string;
      platform?: string;
    }>;
  };
  updatedAt: string;
}

export interface UpdateLimitsPayload {
  users?: number;
  stores?: number;
  products?: number;
  monthlyTransactions?: number;
  storageBytes?: number;
}

export interface UpdatePlanPayload {
  plan?: string;
  billingCycle?: 'monthly' | 'yearly';
  status?: string;
  features?: Record<string, boolean>;
}

export const tenantService = {
  async getUsage(tenantId: string) {
    const response = await api.get<{
      success: boolean;
      data: TenantUsageResponse;
      message: string;
    }>(
      `/tenants/${tenantId}/usage`
    );
    return response.data.data;
  },

  async updateLimits(tenantId: string, limits: UpdateLimitsPayload) {
    const response = await api.patch<{
      success: boolean;
      data: { tenant: any };
      message: string;
    }>(
      `/tenants/${tenantId}/limits`,
      { limits }
    );
    return response.data.data.tenant;
  },

  async updatePlan(tenantId: string, payload: UpdatePlanPayload) {
    const response = await api.patch<{
      success: boolean;
      data: { tenant: any };
      message: string;
    }>(
      `/tenants/${tenantId}/plan`,
      payload
    );
    return response.data.data.tenant;
  },
};


