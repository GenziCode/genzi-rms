import api from '@/lib/api';
import type {
  Sale,
  CreateSaleRequest,
  HoldTransactionRequest,
  ResumeTransactionRequest,
  VoidSaleRequest,
  RefundSaleRequest,
  SaleQueryParams,
  SaleListResponse,
  DailySummary,
  Payment,
  Customer,
} from '@/types/pos.types';

const safeNumber = (value: any): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const normalizeCustomer = (customer: any | undefined): Customer | undefined => {
  if (!customer) return undefined;

  const nameParts = [customer.name, customer.firstName, customer.lastName]
    .filter(Boolean)
    .map((part: string) => part.trim());

  const normalized: Customer = {
    _id: customer._id ?? customer.id ?? '',
    name: nameParts.length ? nameParts.join(' ').trim() : 'Guest',
    phone: customer.phone ?? '',
  };

  if (customer.email) normalized.email = customer.email;
  if (customer.address) normalized.address = customer.address;
  if (customer.loyaltyPoints !== undefined)
    normalized.loyaltyPoints = safeNumber(customer.loyaltyPoints);
  if (customer.creditLimit !== undefined)
    normalized.creditLimit = safeNumber(customer.creditLimit);
  if (customer.creditBalance !== undefined)
    normalized.creditBalance = safeNumber(customer.creditBalance);
  if (customer.totalSpent !== undefined)
    normalized.totalSpent = safeNumber(customer.totalSpent);
  if (customer.totalPurchases !== undefined)
    normalized.totalPurchases = safeNumber(customer.totalPurchases);

  return normalized;
};

const normalizePayments = (payments: any[] | undefined): Payment[] =>
  Array.isArray(payments)
    ? payments.map((payment) => ({
        method: payment.method ?? 'cash',
        amount: safeNumber(payment.amount),
        reference: payment.reference,
        note: payment.note,
      }))
    : [];

const normalizeSale = (sale: any): Sale => {
  if (!sale) {
    throw new Error('Invalid sale payload');
  }

  const items: Sale['items'] =
    Array.isArray(sale.items) && sale.items.length > 0
      ? sale.items.map((item: any) => {
          const quantity = safeNumber(item.quantity);
          const unitPrice = safeNumber(item.unitPrice ?? item.price);
          const total = safeNumber(
            item.total ?? item.subtotal ?? quantity * unitPrice
          );

          return {
            productId:
              item.productId ??
              item.product?._id ??
              item.product ??
              item.product?._id?.toString() ??
              '',
            productName:
              item.productName ?? item.name ?? item.product?.name ?? 'Product',
            quantity,
            unitPrice,
            discount: safeNumber(item.discount ?? item.discountAmount),
            taxAmount: safeNumber(item.taxAmount ?? item.tax),
            total,
          };
        })
      : [];

  const subtotal = safeNumber(
    sale.subtotal ??
      sale.amountBeforeTax ??
      (items.length > 0
        ? items.reduce((sum: number, item) => sum + item.total, 0)
        : sale.total)
  );

  const totalDiscount = safeNumber(
    sale.totalDiscount ?? sale.discount ?? sale.discountAmount
  );
  const totalTax = safeNumber(sale.totalTax ?? sale.tax);
  const grandTotal = safeNumber(
    sale.grandTotal ?? sale.total ?? subtotal + totalTax - totalDiscount
  );

  const payments = normalizePayments(sale.payments);
  const amountPaid =
    (sale.amountPaid !== undefined ? safeNumber(sale.amountPaid) : 0) ||
    payments.reduce((sum: number, payment) => sum + payment.amount, 0) ||
    grandTotal;

  const changeGiven =
    sale.changeGiven !== undefined || sale.change !== undefined
      ? safeNumber(sale.changeGiven ?? sale.change)
      : Math.max(0, amountPaid - grandTotal);

  const normalized: Sale = {
    _id: sale._id ?? sale.id ?? '',
    saleNumber: sale.saleNumber ?? sale.reference ?? '',
    storeId:
      sale.store?.toString?.() ??
      sale.storeId ??
      sale.store?._id ??
      sale.store ??
      '',
    cashierId:
      sale.cashier?.toString?.() ??
      sale.cashierId ??
      sale.cashier?._id ??
      sale.cashier ??
      '',
    customerId:
      sale.customerId ??
      sale.customer?._id ??
      sale.customer?._id?.toString?.() ??
      undefined,
    customer: normalizeCustomer(sale.customer),
    items,
    subtotal,
    totalDiscount,
    totalTax,
    grandTotal,
    amountPaid,
    changeGiven,
    payments,
    status: sale.status ?? 'completed',
    voidReason: sale.voidReason,
    notes: sale.notes,
    createdAt: sale.createdAt ?? new Date().toISOString(),
    updatedAt: sale.updatedAt ?? sale.createdAt ?? new Date().toISOString(),
  };

  if (sale.refundAmount !== undefined) {
    normalized.refundAmount = safeNumber(sale.refundAmount);
  }

  if (sale.refundReason) {
    normalized.refundReason = sale.refundReason;
  }

  return normalized;
};

const normalizeSaleList = (payload: any): SaleListResponse => {
  // Handle API response structure: { success, data: { sales, total, page, totalPages }, message, meta }
  const data = payload.data || payload;

  return {
    sales: Array.isArray(data.sales)
      ? data.sales.map((sale: any) => normalizeSale(sale))
      : [],
    total: data.total ?? 0,
    page: data.page ?? 1,
    totalPages: data.totalPages ?? 1,
    pagination: {
      page: data.page ?? 1,
      limit: data.sales?.length ?? 0,
      total: data.total ?? 0,
      totalPages: data.totalPages ?? 1,
    },
  };
};

export const posService = {
  /**
   * Create a new sale (complete transaction)
   * POST /api/sales
   */
  async createSale(data: CreateSaleRequest) {
    const response = await api.post<{ data: Sale }>('/sales', data);
    return normalizeSale(response.data);
  },

  /**
   * Get all sales with filters
   * GET /api/sales
   */
  async getSales(params?: SaleQueryParams) {
    const response = await api.get<{
      success: boolean;
      data: { sales: Sale[]; total: number; page: number; totalPages: number };
      message: string;
      meta?: {
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };
    }>('/sales', { params });
    return normalizeSaleList(response.data);
  },

  /**
   * Get sale by ID
   * GET /api/sales/:id
   */
  async getSaleById(id: string) {
    const response = await api.get<{ data: Sale }>(`/sales/${id}`);
    return normalizeSale(response.data);
  },

  /**
   * Hold transaction (save for later)
   * POST /api/sales/hold
   */
  async holdTransaction(data: HoldTransactionRequest) {
    const response = await api.post<{ data: Sale }>('/sales/hold', data);
    return normalizeSale(response.data);
  },

  /**
   * Get all held transactions
   * GET /api/sales/hold
   */
  async getHeldTransactions() {
    const response = await api.get<{ data: Sale[] }>('/sales/hold');
    return Array.isArray(response.data)
      ? response.data.map((sale) => normalizeSale(sale))
      : [];
  },

  /**
   * Resume held transaction
   * POST /api/sales/resume/:id
   */
  async resumeTransaction(id: string, data: ResumeTransactionRequest) {
    const response = await api.post<{ data: Sale }>(
      `/sales/resume/${id}`,
      data
    );
    return normalizeSale(response.data);
  },

  /**
   * Void a sale
   * POST /api/sales/:id/void
   */
  async voidSale(id: string, data: VoidSaleRequest) {
    const response = await api.post<{ data: Sale }>(`/sales/${id}/void`, data);
    return normalizeSale(response.data);
  },

  /**
   * Refund a sale (full or partial)
   * POST /api/sales/:id/refund
   */
  async refundSale(id: string, data: RefundSaleRequest) {
    const response = await api.post<{ data: Sale }>(
      `/sales/${id}/refund`,
      data
    );
    return normalizeSale(response.data);
  },

  /**
   * Get daily summary
   * GET /api/sales/daily-summary
   */
  async getDailySummary(params?: { storeId?: string; date?: string }) {
    const response = await api.get<{ data: DailySummary }>(
      '/sales/daily-summary',
      {
        params,
      }
    );
    return response.data;
  },
};
