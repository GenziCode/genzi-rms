import { getTenantConnection } from '../config/database';
import { InvoiceSchema, IInvoice, DocumentType, DocumentStatus } from '../models/invoice.model';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/appError';
import { logger } from '../utils/logger';
import { generateInvoiceNumber } from '../utils/invoice-number';
import { emailService } from '../utils/email';
import { smsService } from '../utils/sms';
import { generateInvoicePDF } from '../utils/invoice-pdf';
import { renderInvoiceEmail } from '../utils/invoice-email-template';
import { SettingsService } from './settings.service';

const DEFAULT_LOCALE = process.env.INVOICE_LOCALE || process.env.APP_LOCALE || 'en-US';
const DEFAULT_CURRENCY = process.env.INVOICE_CURRENCY || process.env.DEFAULT_CURRENCY || 'USD';

const formatCurrencyValue = (value: number, locale = DEFAULT_LOCALE, currency = DEFAULT_CURRENCY) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
// Barcode/QR disabled - import { generateBarcodeBase64 } from '../utils/barcode';
// Barcode/QR disabled - import { generateInvoiceQRCode } from '../utils/qrcode';

export class InvoiceService {
  private settingsService = new SettingsService();

  /**
   * Get all invoices with filters and pagination
   */
  async getAll(
    tenantId: string,
    filters: {
      type?: DocumentType;
      status?: DocumentStatus;
      customerId?: string;
      startDate?: Date;
      endDate?: Date;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const tenantConn = await getTenantConnection(tenantId);
    const Invoice = tenantConn.model<IInvoice>('Invoice', InvoiceSchema);

    const query: any = { tenantId };

    // Apply filters
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;
    if (filters.customerId) query['to.customerId'] = filters.customerId;
    
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = filters.startDate;
      if (filters.endDate) query.date.$lte = filters.endDate;
    }

    if (filters.search) {
      query.$or = [
        { invoiceNumber: { $regex: filters.search, $options: 'i' } },
        { 'to.customerName': { $regex: filters.search, $options: 'i' } },
        { referenceNumber: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('to.customerId', 'name email phone')
        .populate('createdBy', 'firstName lastName email')
        .lean(),
      Invoice.countDocuments(query),
    ]);

    return {
      invoices,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get invoice by ID
   */
  async getById(tenantId: string, invoiceId: string): Promise<IInvoice> {
    const tenantConn = await getTenantConnection(tenantId);
    const Invoice = tenantConn.model<IInvoice>('Invoice', InvoiceSchema);

    const invoice = await Invoice.findOne({ _id: invoiceId, tenantId })
      .populate('to.customerId', 'name email phone address')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!invoice) {
      throw new NotFoundError('Invoice');
    }

    return invoice;
  }

  /**
   * Get invoice by invoice number
   */
  async getByNumber(tenantId: string, invoiceNumber: string): Promise<IInvoice> {
    const tenantConn = await getTenantConnection(tenantId);
    const Invoice = tenantConn.model<IInvoice>('Invoice', InvoiceSchema);

    const invoice = await Invoice.findOne({ invoiceNumber, tenantId })
      .populate('to.customerId', 'name email phone address')
      .populate('createdBy', 'firstName lastName email');

    if (!invoice) {
      throw new NotFoundError('Invoice');
    }

    return invoice;
  }

  /**
   * Create new invoice
   */
  async create(
    tenantId: string,
    userId: string,
    data: Partial<IInvoice>,
    tenantSubdomain: string
  ): Promise<IInvoice> {
    const tenantConn = await getTenantConnection(tenantId);
    const Invoice = tenantConn.model<IInvoice>('Invoice', InvoiceSchema);

    // Generate invoice number if not provided
    if (!data.invoiceNumber) {
      data.invoiceNumber = await generateInvoiceNumber(tenantId, data.type || 'sale_invoice');
    }

    // Barcode/QR generation DISABLED
    // data.barcode = await generateBarcodeBase64(data.invoiceNumber);
    // data.qrCode = await generateInvoiceQRCode(data.invoiceNumber!, tenantSubdomain);

    // Calculate totals if items provided
    if (data.items && data.items.length > 0) {
      const totals = this.calculateTotals(data.items);
      data.subtotal = totals.subtotal;
      data.totalTax = totals.totalTax;
      data.totalDiscount = totals.totalDiscount;
      data.total = totals.total + (data.shippingCost || 0) + (data.adjustments || 0);
      data.amountDue = data.total - (data.amountPaid || 0);
    }

    const invoice = new Invoice({
      ...data,
      tenantId,
      createdBy: userId,
      amountPaid: data.amountPaid || 0,
    });

    await invoice.save();

    logger.info(`Invoice created: ${invoice.invoiceNumber} by user: ${userId}`);

    return invoice;
  }

  /**
   * Update invoice
   */
  async update(
    tenantId: string,
    invoiceId: string,
    userId: string,
    data: Partial<IInvoice>
  ): Promise<IInvoice> {
    const tenantConn = await getTenantConnection(tenantId);
    const Invoice = tenantConn.model<IInvoice>('Invoice', InvoiceSchema);

    const invoice = await Invoice.findOne({ _id: invoiceId, tenantId });

    if (!invoice) {
      throw new NotFoundError('Invoice');
    }

    // Prevent updates to paid/cancelled invoices
    if (['paid', 'cancelled', 'void'].includes(invoice.status)) {
      throw new BadRequestError(`Cannot update ${invoice.status} invoice`);
    }

    // Recalculate totals if items changed
    if (data.items && data.items.length > 0) {
      const totals = this.calculateTotals(data.items);
      data.subtotal = totals.subtotal;
      data.totalTax = totals.totalTax;
      data.totalDiscount = totals.totalDiscount;
      data.total = totals.total + (data.shippingCost || invoice.shippingCost || 0) + (data.adjustments || invoice.adjustments || 0);
      data.amountDue = data.total - (invoice.amountPaid || 0);
    }

    Object.assign(invoice, data, { updatedBy: userId });
    await invoice.save();

    logger.info(`Invoice updated: ${invoice.invoiceNumber} by user: ${userId}`);

    return invoice;
  }

  /**
   * Delete invoice
   */
  async delete(tenantId: string, invoiceId: string): Promise<void> {
    const tenantConn = await getTenantConnection(tenantId);
    const Invoice = tenantConn.model<IInvoice>('Invoice', InvoiceSchema);

    const invoice = await Invoice.findOne({ _id: invoiceId, tenantId });

    if (!invoice) {
      throw new NotFoundError('Invoice');
    }

    // Only allow deletion of draft invoices
    if (invoice.status !== 'draft') {
      throw new BadRequestError('Only draft invoices can be deleted. Use void instead.');
    }

    await Invoice.deleteOne({ _id: invoiceId });

    logger.info(`Invoice deleted: ${invoice.invoiceNumber}`);
  }

  /**
   * Update invoice status
   */
  async updateStatus(
    tenantId: string,
    invoiceId: string,
    status: DocumentStatus
  ): Promise<IInvoice> {
    const tenantConn = await getTenantConnection(tenantId);
    const Invoice = tenantConn.model<IInvoice>('Invoice', InvoiceSchema);

    const invoice = await Invoice.findOne({ _id: invoiceId, tenantId });

    if (!invoice) {
      throw new NotFoundError('Invoice');
    }

    // Validate status transitions
    if (invoice.status === 'void' || invoice.status === 'cancelled') {
      throw new BadRequestError('Cannot change status of voided/cancelled invoice');
    }

    invoice.status = status;
    await invoice.save();

    logger.info(`Invoice status updated: ${invoice.invoiceNumber} -> ${status}`);

    return invoice;
  }

  /**
   * Record payment for invoice
   */
  async recordPayment(
    tenantId: string,
    invoiceId: string,
    payment: {
      method: string;
      amount: number;
      reference?: string;
      date?: Date;
    }
  ): Promise<IInvoice> {
    const tenantConn = await getTenantConnection(tenantId);
    const Invoice = tenantConn.model<IInvoice>('Invoice', InvoiceSchema);

    const invoice = await Invoice.findOne({ _id: invoiceId, tenantId });

    if (!invoice) {
      throw new NotFoundError('Invoice');
    }

    if (invoice.status === 'void' || invoice.status === 'cancelled') {
      throw new BadRequestError('Cannot record payment for voided/cancelled invoice');
    }

    if (payment.amount <= 0) {
      throw new BadRequestError('Payment amount must be greater than 0');
    }

    if (payment.amount > invoice.amountDue) {
      throw new BadRequestError('Payment amount exceeds amount due');
    }

    // Add payment to payments array
    if (!invoice.payments) {
      invoice.payments = [];
    }

    invoice.payments.push({
      method: payment.method as any,
      amount: payment.amount,
      reference: payment.reference,
      date: payment.date || new Date(),
    });

    // Update amounts
    invoice.amountPaid += payment.amount;
    invoice.amountDue = invoice.total - invoice.amountPaid;

    // Update status based on payment
    if (invoice.amountDue === 0) {
      invoice.status = 'paid';
    } else if (invoice.amountPaid > 0) {
      invoice.status = 'partial';
    }

    await invoice.save();

    logger.info(`Payment recorded for invoice: ${invoice.invoiceNumber} - Amount: ${payment.amount}`);

    return invoice;
  }

  /**
   * Send invoice via email with optional PDF attachment
   */
  async sendEmail(
    tenantId: string,
    invoiceId: string,
    options: {
      email: string;
      subject?: string;
      message?: string;
      cc?: string[];
      bcc?: string[];
      attachPdf?: boolean;
    }
  ): Promise<void> {
    const invoice = await this.getById(tenantId, invoiceId);
    const subject =
      options.subject?.trim() || `Invoice ${invoice.invoiceNumber || invoiceId}`;

    const portalUrl = this.buildInvoicePortalUrl(invoice);
    const html = renderInvoiceEmail(invoice, {
      message: options.message,
      portalUrl,
      locale: DEFAULT_LOCALE,
      currency: DEFAULT_CURRENCY,
    });

    let attachments:
      | Array<{ filename: string; content: Buffer; contentType: string }>
      | undefined;
    if (options.attachPdf !== false) {
      const pdfBuffer = await generateInvoicePDF(invoice, {
        currency: DEFAULT_CURRENCY,
        locale: DEFAULT_LOCALE,
      });
      attachments = [
        {
          filename: `${invoice.invoiceNumber || 'invoice'}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ];
    }

    const settings = await this.settingsService.getSettings(tenantId, 'Main Store');
    const emailConfig = settings.notifications?.emailConfig;
    const canUseTenantEmail =
      settings.notifications?.emailNotifications &&
      emailConfig?.enabled &&
      emailConfig.host &&
      emailConfig.user &&
      emailConfig.password;

    if (!canUseTenantEmail && !emailService.isConfigured()) {
      throw new BadRequestError(
        'Email service is not configured. Please configure SMTP settings in Communications.'
      );
    }

    const sent = await emailService.sendEmail({
      to: options.email,
      subject,
      html,
      cc: options.cc,
      bcc: options.bcc,
      attachments,
      transportOverride: canUseTenantEmail
        ? {
            host: emailConfig!.host!,
            port: emailConfig!.port ?? 587,
            secure: emailConfig!.secure ?? false,
            auth: {
              user: emailConfig!.user!,
              pass: emailConfig!.password!,
            },
            from: emailConfig!.fromEmail,
            replyTo: emailConfig!.replyTo,
          }
        : undefined,
    });

    if (!sent) {
      throw new BadRequestError('Failed to send invoice email. Check SMTP configuration.');
    }

    await this.markInvoiceAsSent(invoice);

    logger.info(
      `Invoice email queued: invoice=${invoice.invoiceNumber} recipient=${options.email}`
    );
  }

  /**
   * Send invoice via SMS (using Twilio)
   */
  async sendSMS(
    tenantId: string,
    invoiceId: string,
    options: {
      phone: string;
      message?: string;
    }
  ): Promise<void> {
    const invoice = await this.getById(tenantId, invoiceId);
    const totalFormatted = formatCurrencyValue(invoice.total || 0);
    const defaultMessageParts = [
      `Invoice ${invoice.invoiceNumber || ''}`.trim(),
      `Total: ${totalFormatted}`,
    ];

    if (invoice.dueDate) {
      defaultMessageParts.push(
        `Due ${invoice.dueDate instanceof Date ? invoice.dueDate.toLocaleDateString() : invoice.dueDate}`
      );
    }

    const portalUrl = this.buildInvoicePortalUrl(invoice);
    if (portalUrl) {
      defaultMessageParts.push(`View: ${portalUrl}`);
    }

    const message =
      options.message?.trim() && options.message.trim().length > 0
        ? options.message.trim()
        : defaultMessageParts.join(' • ');

    const settings = await this.settingsService.getSettings(tenantId, 'Main Store');
    const smsConfig = settings.notifications?.smsConfig;
    const canUseTenantSms =
      settings.notifications?.smsNotifications &&
      smsConfig?.enabled &&
      smsConfig.accountSid &&
      smsConfig.authToken &&
      smsConfig.fromNumber;

    if (!canUseTenantSms && !smsService.isConfigured()) {
      throw new BadRequestError(
        'SMS service is not configured. Please configure SMS credentials in Communications.'
      );
    }

    const sent = await smsService.sendSMS(options.phone, message, canUseTenantSms
      ? {
          provider: smsConfig!.provider || 'twilio',
          accountSid: smsConfig!.accountSid!,
          authToken: smsConfig!.authToken!,
          fromNumber: smsConfig!.fromNumber!,
        }
      : undefined);

    if (!sent) {
      throw new BadRequestError('Failed to send invoice SMS. Check SMS configuration.');
    }

    await this.markInvoiceAsSent(invoice);

    logger.info(
      `Invoice SMS queued: invoice=${invoice.invoiceNumber} recipient=${options.phone}`
    );
  }

  /**
   * Generate invoice from sale
   */
  async generateFromSale(
    tenantId: string,
    saleId: string,
    userId: string,
    tenantSubdomain: string
  ): Promise<IInvoice> {
    const tenantConn = await getTenantConnection(tenantId);
    const Sale = tenantConn.model('Sale');
    const Invoice = tenantConn.model<IInvoice>('Invoice', InvoiceSchema);
    const Store = tenantConn.model('Store');

    // Get sale details
    const sale = await Sale.findOne({ _id: saleId, tenantId })
      .populate('customer')
      .populate('store')
      .populate('items.product');

    if (!sale) {
      throw new NotFoundError('Sale');
    }

    // Check if invoice already exists for this sale
    const existingInvoice = await Invoice.findOne({ saleId, tenantId });
    if (existingInvoice) {
      throw new BadRequestError('Invoice already exists for this sale');
    }

    // Get store details
    const store = sale.store || await Store.findById(sale.storeId);

    // Prepare invoice data
    const invoiceNumber = await generateInvoiceNumber(tenantId, 'sale_invoice');
    
    const invoiceData: Partial<IInvoice> = {
      invoiceNumber,
      type: 'sale_invoice',
      status: sale.payments && sale.payments.length > 0 ? 'paid' : 'pending',
      date: sale.createdAt,
      from: {
        businessName: store?.name || 'Your Business',
        address: store?.address || {
          name: store?.name || 'Your Business',
          line1: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
        taxId: store?.businessDetails?.taxId,
        registrationNumber: store?.businessDetails?.registrationNumber,
      },
      to: {
        customerId: sale.customer?._id,
        customerName: sale.customer?.name || 'Walk-in Customer',
        address: sale.customer?.address || {
          name: sale.customer?.name || 'Walk-in Customer',
          line1: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
      },
      items: sale.items.map((item: any) => ({
        productId: item.product._id,
        productName: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        unit: item.product.unit || 'pcs',
        unitPrice: item.price,
        discount: item.discount || 0,
        discountType: item.discountType || 'fixed',
        taxRate: item.taxRate || 0,
        taxAmount: item.tax || 0,
        subtotal: item.subtotal,
        total: item.total,
      })),
      subtotal: sale.subtotal,
      totalDiscount: sale.discount || 0,
      totalTax: sale.tax || 0,
      total: sale.total,
      amountPaid: sale.total,
      amountDue: 0,
      payments: sale.payments?.map((p: any) => ({
        method: p.method,
        amount: p.amount,
        reference: p.reference,
        date: p.paidAt || sale.createdAt,
      })),
      saleId: sale._id,
      salesPerson: sale.cashier?.firstName + ' ' + sale.cashier?.lastName,
      tenantId,
      storeId: sale.storeId,
      createdBy: userId,
    };

    // Barcode/QR generation DISABLED
    // invoiceData.barcode = await generateBarcodeBase64(invoiceNumber);
    // invoiceData.qrCode = await generateInvoiceQRCode(invoiceNumber, tenantSubdomain);

    const invoice = new Invoice(invoiceData);
    await invoice.save();

    logger.info(`Invoice generated from sale: ${sale._id} -> ${invoice.invoiceNumber}`);

    return invoice;
  }

  /**
   * Convert quotation to invoice
   */
  async convertQuotation(
    tenantId: string,
    quotationId: string,
    userId: string,
    tenantSubdomain: string
  ): Promise<IInvoice> {
    const tenantConn = await getTenantConnection(tenantId);
    const Invoice = tenantConn.model<IInvoice>('Invoice', InvoiceSchema);

    const quotation = await Invoice.findOne({
      _id: quotationId,
      tenantId,
      type: 'quotation',
    });

    if (!quotation) {
      throw new NotFoundError('Quotation');
    }

    // Generate new invoice number
    const invoiceNumber = await generateInvoiceNumber(tenantId, 'sale_invoice');

    // Create invoice from quotation
    const invoiceData = quotation.toObject();
    delete invoiceData._id;
    delete invoiceData.createdAt;
    delete invoiceData.updatedAt;

    const invoice = new Invoice({
      ...invoiceData,
      invoiceNumber,
      type: 'sale_invoice',
      status: 'pending',
      referenceNumber: quotation.invoiceNumber,
      createdBy: userId,
      // Barcode/QR DISABLED
      // barcode: await generateBarcodeBase64(invoiceNumber),
      // qrCode: await generateInvoiceQRCode(invoiceNumber, tenantSubdomain),
    });

    await invoice.save();

    logger.info(`Quotation converted: ${quotation.invoiceNumber} -> ${invoice.invoiceNumber}`);

    return invoice;
  }

  /**
   * Duplicate invoice
   */
  async duplicate(
    tenantId: string,
    invoiceId: string,
    userId: string,
    tenantSubdomain: string
  ): Promise<IInvoice> {
    const tenantConn = await getTenantConnection(tenantId);
    const Invoice = tenantConn.model<IInvoice>('Invoice', InvoiceSchema);

    const original = await Invoice.findOne({ _id: invoiceId, tenantId });

    if (!original) {
      throw new NotFoundError('Invoice');
    }

    // Generate new invoice number
    const invoiceNumber = await generateInvoiceNumber(tenantId, original.type);

    // Create duplicate
    const invoiceData = original.toObject();
    delete invoiceData._id;
    delete invoiceData.createdAt;
    delete invoiceData.updatedAt;

    const invoice = new Invoice({
      ...invoiceData,
      invoiceNumber,
      status: 'draft',
      date: new Date(),
      amountPaid: 0,
      amountDue: original.total,
      payments: [],
      referenceNumber: original.invoiceNumber,
      createdBy: userId,
      // Barcode/QR DISABLED
      // barcode: await generateBarcodeBase64(invoiceNumber),
      // qrCode: await generateInvoiceQRCode(invoiceNumber, tenantSubdomain),
    });

    await invoice.save();

    logger.info(`Invoice duplicated: ${original.invoiceNumber} -> ${invoice.invoiceNumber}`);

    return invoice;
  }

  private async markInvoiceAsSent(invoice: IInvoice): Promise<void> {
    if (['draft', 'pending'].includes(invoice.status)) {
      invoice.status = 'sent';
      await invoice.save();
    }
  }

  private buildInvoicePortalUrl(invoice: IInvoice): string | undefined {
    const baseUrl = process.env.CUSTOMER_PORTAL_URL || process.env.FRONTEND_URL;
    if (!baseUrl) {
      return undefined;
    }

    const id = (invoice as any)._id?.toString?.() || (invoice as any).id;
    if (!id) {
      return baseUrl.replace(/\/$/, '');
    }

    return `${baseUrl.replace(/\/$/, '')}/invoices/${id}`;
  }

  /**
   * Calculate totals from items
   */
  private calculateTotals(items: any[]): {
    subtotal: number;
    totalTax: number;
    totalDiscount: number;
    total: number;
  } {
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    items.forEach((item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      
      // Calculate discount
      let itemDiscount = 0;
      if (item.discount) {
        itemDiscount = item.discountType === 'percentage' 
          ? (itemSubtotal * item.discount) / 100 
          : item.discount;
      }

      // Calculate tax
      const taxableAmount = itemSubtotal - itemDiscount;
      const itemTax = item.taxRate ? (taxableAmount * item.taxRate) / 100 : 0;

      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;
      totalTax += itemTax;

      // Update item totals
      item.subtotal = itemSubtotal;
      item.taxAmount = itemTax;
      item.total = taxableAmount + itemTax;
    });

    const total = subtotal - totalDiscount + totalTax;

    return {
      subtotal,
      totalTax,
      totalDiscount,
      total,
    };
  }

  /**
   * Get next invoice number (preview)
   */
  async getNextNumber(tenantId: string, type: DocumentType = 'sale_invoice'): Promise<string> {
    return await generateInvoiceNumber(tenantId, type);
  }
}

export const invoiceService = new InvoiceService();

