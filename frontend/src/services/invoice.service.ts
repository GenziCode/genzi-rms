import api from '@/lib/api';
import type { Invoice, DocumentType, DocumentStatus, InvoiceTemplate } from '@/types/invoice.types';

export const invoiceService = {
  /**
   * Get all invoices with filters
   */
  async getAll(filters?: {
    type?: DocumentType;
    status?: DocumentStatus;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const params = filters
      ? Object.fromEntries(
          Object.entries(filters).filter(([_, value]) =>
            value !== undefined && value !== null && value !== ''
          )
        )
      : undefined;

    const response = await api.get<{ data: { invoices: Invoice[]; pagination: any } }>('/invoices', {
      params,
    });
    return response.data.data;
  },

  /**
   * Get single invoice by ID
   */
  async getById(id: string) {
    const response = await api.get<{ data: Invoice }>(`/invoices/${id}`);
    return response.data.data;
  },

  /**
   * Get invoice by invoice number
   */
  async getByNumber(invoiceNumber: string) {
    const response = await api.get<{ data: Invoice }>(`/invoices/number/${invoiceNumber}`);
    return response.data.data;
  },

  /**
   * Create new invoice
   */
  async create(data: Partial<Invoice>) {
    const response = await api.post<{ data: Invoice }>('/invoices', data);
    return response.data.data;
  },

  /**
   * Update invoice
   */
  async update(id: string, data: Partial<Invoice>) {
    const response = await api.put<{ data: Invoice }>(`/invoices/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete invoice
   */
  async delete(id: string) {
    await api.delete(`/invoices/${id}`);
  },

  /**
   * Change invoice status
   */
  async updateStatus(id: string, status: DocumentStatus) {
    const response = await api.patch<{ data: Invoice }>(`/invoices/${id}/status`, { status });
    return response.data.data;
  },

  /**
   * Record payment for invoice
   */
  async recordPayment(id: string, payment: {
    method: string;
    amount: number;
    reference?: string;
    date: string;
  }) {
    const response = await api.post<{ data: Invoice }>(`/invoices/${id}/payments`, payment);
    return response.data.data;
  },

  /**
   * Send invoice via email
   */
  async sendEmail(
    id: string,
    email: string,
    options?: {
      subject?: string;
      message?: string;
      attachPdf?: boolean;
      cc?: string[];
      bcc?: string[];
    }
  ) {
    const response = await api.post<{ data: { sent: boolean } }>(`/invoices/${id}/send`, {
      email,
      subject: options?.subject,
      message: options?.message,
      attachPdf: options?.attachPdf,
      cc: options?.cc,
      bcc: options?.bcc,
    });
    return response.data.data;
  },

  /**
   * Send invoice via SMS
   */
  async sendSMS(
    id: string,
    phone: string,
    options?: {
      message?: string;
    }
  ) {
    const response = await api.post<{ data: { sent: boolean } }>(`/invoices/${id}/send-sms`, {
      phone,
      message: options?.message,
    });
    return response.data.data;
  },

  /**
   * Download invoice as PDF
   */
  async downloadPDF(id: string) {
    const response = await api.get(`/invoices/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data.data;
  },

  /**
   * Generate invoice from sale
   */
  async generateFromSale(saleId: string) {
    const response = await api.post<{ data: Invoice }>('/invoices/generate', {
      saleId,
      type: 'sale_invoice',
    });
    return response.data.data;
  },

  /**
   * Convert quotation to invoice
   */
  async convertQuotation(quotationId: string) {
    const response = await api.post<{ data: Invoice }>(`/invoices/${quotationId}/convert`, {
      type: 'sale_invoice',
    });
    return response.data.data;
  },

  /**
   * Duplicate invoice
   */
  async duplicate(id: string) {
    const response = await api.post<{ data: Invoice }>(`/invoices/${id}/duplicate`);
    return response.data.data;
  },

  /**
   * Get next invoice number
   */
  async getNextNumber(type: DocumentType = 'sale_invoice') {
    const response = await api.get<{ data: { nextNumber: string } }>('/invoices/next-number', {
      params: { type },
    });
    return response.data.data.nextNumber;
  },

  /**
   * Get invoice templates
   */
  getTemplates(): InvoiceTemplate[] {
    return [
      {
        id: 'modern',
        name: 'Modern',
        type: 'modern',
        description: 'Clean, modern design with gradient header',
        thumbnail: '/templates/modern.png',
      },
      {
        id: 'classic',
        name: 'Classic',
        type: 'classic',
        description: 'Traditional business invoice',
        thumbnail: '/templates/classic.png',
      },
      {
        id: 'minimal',
        name: 'Minimal',
        type: 'minimal',
        description: 'Simple and clean',
        thumbnail: '/templates/minimal.png',
      },
      {
        id: 'professional',
        name: 'Professional',
        type: 'professional',
        description: 'Corporate professional look',
        thumbnail: '/templates/professional.png',
      },
      {
        id: 'thermal',
        name: 'Thermal Receipt',
        type: 'thermal',
        description: 'Optimized for thermal printers (80mm)',
        thumbnail: '/templates/thermal.png',
      },
    ];
  },
};

