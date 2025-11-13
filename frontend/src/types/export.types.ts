/**
 * Export & Sync Types
 */

export type ExportFormat = 'csv' | 'excel' | 'pdf';
export type ExportEntity = 'products' | 'sales' | 'customers' | 'inventory' | 'vendors';

export interface ExportRequest {
  entity: ExportEntity;
  format: ExportFormat;
  startDate?: string;
  endDate?: string;
  filters?: Record<string, any>;
}

export interface ImportRequest {
  entity: ExportEntity;
  file: File;
}

export interface SyncQueueItem {
  _id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  entityId: string;
  data: any;
  status: 'pending' | 'synced' | 'failed';
  attempts: number;
  createdAt: string;
  syncedAt?: string;
}

