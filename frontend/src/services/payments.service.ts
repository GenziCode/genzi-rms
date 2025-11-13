import api from '@/lib/api';

interface Payment {
  _id: string;
  tenantId: string;
  invoiceId?: string;
  customerId?: string;
  amount: number;
  currency: string;
  method: 'stripe' | 'cash' | 'bank_transfer';
  status:
    | 'pending'
    | 'processing'
    | 'succeeded'
    | 'failed'
    | 'refunded'
    | 'cancelled';
  stripePaymentIntentId?: string;
  metadata?: Record<string, any>;
  errorMessage?: string;
  refundedAmount?: number;
  createdAt: string;
  updatedAt: string;
}

interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

interface PaymentStatistics {
  totalAmount: number;
  totalCount: number;
  succeededAmount: number;
  succeededCount: number;
  failedCount: number;
  refundedAmount: number;
  refundedCount: number;
  byMethod: {
    method: string;
    amount: number;
    count: number;
  }[];
  byStatus: {
    status: string;
    amount: number;
    count: number;
  }[];
}

export const paymentsService = {
  /**
   * Create payment intent (Stripe)
   */
  async createIntent(data: {
    amount: number;
    currency?: string;
    invoiceId?: string;
    customerId?: string;
    description?: string;
  }) {
    const response = await api.post<{ data: { intent: PaymentIntent } }>(
      '/payments/intent',
      data
    );
    return response.data.data.intent;
  },

  /**
   * Confirm payment
   */
  async confirmPayment(data: {
    paymentIntentId: string;
    paymentMethodId: string;
  }) {
    const response = await api.post<{ data: { payment: Payment } }>(
      '/payments/confirm',
      data
    );
    return response.data.data.payment;
  },

  /**
   * Get payment by ID
   */
  async getById(id: string) {
    const response = await api.get<{ data: { payment: Payment } }>(
      `/payments/${id}`
    );
    return response.data.data.payment;
  },

  /**
   * Get all payments with filters
   */
  async getAll(filters?: {
    status?: string;
    method?: string;
    customerId?: string;
    invoiceId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await api.get<{
      data: {
        payments: Payment[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      };
    }>('/payments', { params: filters });
    return response.data.data;
  },

  /**
   * Refund payment
   */
  async refund(
    id: string,
    data: {
      amount?: number;
      reason?: string;
    }
  ) {
    const response = await api.post<{ data: { payment: Payment } }>(
      `/payments/${id}/refund`,
      data
    );
    return response.data.data.payment;
  },

  /**
   * Get payments for customer
   */
  async getByCustomer(
    customerId: string,
    filters?: {
      page?: number;
      limit?: number;
    }
  ) {
    const response = await api.get<{
      data: {
        payments: Payment[];
        pagination: any;
      };
    }>(`/payments/customer/${customerId}`, { params: filters });
    return response.data.data;
  },

  /**
   * Get payments for invoice
   */
  async getByInvoice(invoiceId: string) {
    const response = await api.get<{
      data: {
        payments: Payment[];
      };
    }>(`/payments/invoice/${invoiceId}`);
    return response.data.data.payments;
  },

  /**
   * Get payment statistics
   */
  async getStatistics(filters?: {
    startDate?: string;
    endDate?: string;
    customerId?: string;
  }) {
    const response = await api.get<{
      data: {
        statistics: PaymentStatistics;
      };
    }>('/payments/statistics', { params: filters });
    return response.data.data.statistics;
  },
};

export type { Payment, PaymentIntent, PaymentStatistics };
