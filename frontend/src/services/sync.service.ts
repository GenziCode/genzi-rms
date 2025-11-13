import api from '@/lib/api';

export interface SyncDevice {
  id: string;
  label?: string;
  status: 'online' | 'offline' | 'degraded';
  lastSeenAt?: string;
  lastSyncAt?: string;
  lastPullAt?: string;
  lastPushAt?: string;
  queueSize?: number;
  conflicts?: number;
  location?: string;
  store?: string;
  appVersion?: string;
  platform?: string;
}

export interface SyncDeviceListResponse {
  count: number;
  online: number;
  offline: number;
  degraded: number;
  devices: SyncDevice[];
}

export interface SyncStatusResponse {
  device?: SyncDevice;
  pendingSales: number;
  conflicts: number;
  lastSyncAt?: string;
}

export const syncService = {
  async getDevices() {
    const response = await api.get<{ data: SyncDeviceListResponse }>(
      '/sync/devices'
    );
    return response.data.data;
  },

  async getDeviceStatus(deviceId: string) {
    const response = await api.get<{ data: SyncStatusResponse }>(
      `/sync/status/${deviceId}`
    );
    return response.data.data;
  },
};


