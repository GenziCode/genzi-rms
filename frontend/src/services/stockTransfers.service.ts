import api from '@/lib/api';

export type StockTransferStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'picking'
  | 'in_transit'
  | 'received'
  | 'cancelled'
  | 'rejected';

export type StockTransferPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface StockTransferItemInput {
  productId: string;
  sku?: string;
  name?: string;
  requestedQty: number;
  approvedQty?: number;
  pickedQty?: number;
  receivedQty?: number;
  uom?: string;
  notes?: string;
}

type StoreReference =
  | string
  | {
      _id: string;
      name?: string;
      code?: string;
      storeCode?: string;
    };

type ProductReference =
  | string
  | {
      _id: string;
      name?: string;
      sku?: string;
      unit?: string;
    };

type UserReference =
  | string
  | {
      _id: string;
      firstName?: string;
      lastName?: string;
    };

export interface StockTransfer {
  _id: string;
  reference: string;
  status: StockTransferStatus;
  priority: StockTransferPriority;
  fromStore: StoreReference;
  toStore: StoreReference;
  reason?: string;
  notes?: string;
  watcherEmails?: string[];
  items: Array<
    StockTransferItemInput & {
      product: ProductReference;
    }
  >;
  approvals?: {
    requestedBy?: string;
    requestedAt?: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectedBy?: string;
    rejectedAt?: string;
    decisionNotes?: string;
  };
  timeline: {
    createdAt: string;
    submittedAt?: string;
    approvedAt?: string;
    pickingStartedAt?: string;
    inTransitAt?: string;
    receivedAt?: string;
    cancelledAt?: string;
    rejectedAt?: string;
  };
  activity: Array<{
    action: string;
    message?: string;
    performedBy: UserReference;
    performedByName?: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransferListResponse {
  records: StockTransfer[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateStockTransferRequest {
  fromStoreId: string;
  toStoreId: string;
  priority?: StockTransferPriority;
  reason?: string;
  notes?: string;
  watcherEmails?: string[];
  items: StockTransferItemInput[];
}

export type UpdateStockTransferRequest = Partial<CreateStockTransferRequest>;

const baseUrl = '/stock-transfers';

export const stockTransfersService = {
  async list(params?: {
    status?: StockTransferStatus;
    priority?: StockTransferPriority;
    fromStoreId?: string;
    toStoreId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<StockTransferListResponse> {
    const response = await api.get<{ data: StockTransferListResponse }>(baseUrl, {
      params,
    });
    return response.data.data;
  },

  async getById(id: string): Promise<StockTransfer> {
    const response = await api.get<{ data: StockTransfer }>(`${baseUrl}/${id}`);
    return response.data.data;
  },

  async create(payload: CreateStockTransferRequest): Promise<StockTransfer> {
    const response = await api.post<{ data: StockTransfer }>(baseUrl, payload);
    return response.data.data;
  },

  async update(
    id: string,
    payload: UpdateStockTransferRequest
  ): Promise<StockTransfer> {
    const response = await api.put<{ data: StockTransfer }>(
      `${baseUrl}/${id}`,
      payload
    );
    return response.data.data;
  },

  async submit(id: string, note?: string) {
    const response = await api.post<{ data: StockTransfer }>(`${baseUrl}/${id}/submit`, {
      note,
    });
    return response.data.data;
  },

  async approve(id: string, note?: string) {
    const response = await api.post<{ data: StockTransfer }>(`${baseUrl}/${id}/approve`, {
      note,
    });
    return response.data.data;
  },

  async reject(id: string, note?: string) {
    const response = await api.post<{ data: StockTransfer }>(`${baseUrl}/${id}/reject`, {
      note,
    });
    return response.data.data;
  },

  async startPicking(id: string, note?: string) {
    const response = await api.post<{ data: StockTransfer }>(
      `${baseUrl}/${id}/start-picking`,
      { note }
    );
    return response.data.data;
  },

  async markInTransit(id: string, note?: string) {
    const response = await api.post<{ data: StockTransfer }>(
      `${baseUrl}/${id}/in-transit`,
      { note }
    );
    return response.data.data;
  },

  async markReceived(id: string, note?: string) {
    const response = await api.post<{ data: StockTransfer }>(
      `${baseUrl}/${id}/received`,
      { note }
    );
    return response.data.data;
  },

  async cancel(id: string, note?: string) {
    const response = await api.post<{ data: StockTransfer }>(`${baseUrl}/${id}/cancel`, {
      note,
    });
    return response.data.data;
  },
};

