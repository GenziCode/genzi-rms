import { Response, NextFunction } from 'express';
import { TenantRequest } from '../types';
import { invoiceService } from '../services/invoice.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';
import { generateInvoicePDF } from '../utils/invoice-pdf';

export class InvoiceController {
  /**
   * Get all invoices
   * GET /api/invoices
   */
  getAll = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const {
      type,
      status,
      customerId,
      startDate,
      endDate,
      search,
      page,
      limit,
    } = req.query;

    const filters = {
      type: type as any,
      status: status as any,
      customerId: customerId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    };

    const result = await invoiceService.getAll(tenantId, filters);

    sendSuccess(res, result, 'Invoices retrieved successfully');
  });

  /**
   * Get invoice by ID
   * GET /api/invoices/:id
   */
  getById = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const invoice = await invoiceService.getById(tenantId, id);

    sendSuccess(res, { invoice }, 'Invoice retrieved successfully');
  });

  /**
   * Get invoice by invoice number
   * GET /api/invoices/number/:number
   */
  getByNumber = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const { number } = req.params;

    const invoice = await invoiceService.getByNumber(tenantId, number);

    sendSuccess(res, { invoice }, 'Invoice retrieved successfully');
  });

  /**
   * Create invoice
   * POST /api/invoices
   */
  create = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    const tenantSubdomain = req.tenant!.subdomain;

    const invoice = await invoiceService.create(tenantId, userId, req.body, tenantSubdomain);

    sendSuccess(res, { invoice }, 'Invoice created successfully', 201);
  });

  /**
   * Update invoice
   * PUT /api/invoices/:id
   */
  update = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    const { id } = req.params;

    const invoice = await invoiceService.update(tenantId, id, userId, req.body);

    sendSuccess(res, { invoice }, 'Invoice updated successfully');
  });

  /**
   * Delete invoice
   * DELETE /api/invoices/:id
   */
  delete = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    await invoiceService.delete(tenantId, id);

    sendSuccess(res, null, 'Invoice deleted successfully');
  });

  /**
   * Update invoice status
   * PATCH /api/invoices/:id/status
   */
  updateStatus = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const { status } = req.body;

    const invoice = await invoiceService.updateStatus(tenantId, id, status);

    sendSuccess(res, { invoice }, 'Invoice status updated successfully');
  });

  /**
   * Record payment
   * POST /api/invoices/:id/payments
   */
  recordPayment = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const invoice = await invoiceService.recordPayment(tenantId, id, req.body);

    sendSuccess(res, { invoice }, 'Payment recorded successfully');
  });

  /**
   * Generate invoice from sale
   * POST /api/invoices/generate
   */
  generateFromSale = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    const tenantSubdomain = req.tenant!.subdomain;
    const { saleId } = req.body;

    const invoice = await invoiceService.generateFromSale(tenantId, saleId, userId, tenantSubdomain);

    sendSuccess(res, { invoice }, 'Invoice generated successfully', 201);
  });

  /**
   * Convert quotation to invoice
   * POST /api/invoices/:id/convert
   */
  convertQuotation = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    const tenantSubdomain = req.tenant!.subdomain;
    const { id } = req.params;

    const invoice = await invoiceService.convertQuotation(tenantId, id, userId, tenantSubdomain);

    sendSuccess(res, { invoice }, 'Quotation converted to invoice successfully', 201);
  });

  /**
   * Duplicate invoice
   * POST /api/invoices/:id/duplicate
   */
  duplicate = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    const tenantSubdomain = req.tenant!.subdomain;
    const { id } = req.params;

    const invoice = await invoiceService.duplicate(tenantId, id, userId, tenantSubdomain);

    sendSuccess(res, { invoice }, 'Invoice duplicated successfully', 201);
  });

  /**
   * Get next invoice number
   * GET /api/invoices/next-number
   */
  getNextNumber = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const { type } = req.query;

    const nextNumber = await invoiceService.getNextNumber(tenantId, type as any);

    sendSuccess(res, { nextNumber }, 'Next invoice number retrieved successfully');
  });

  /**
   * Send invoice via email
   * POST /api/invoices/:id/send
   */
  sendEmail = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const { email, subject, message, cc, bcc, attachPdf } = req.body;

    await invoiceService.sendEmail(tenantId, id, {
      email,
      subject,
      message,
      cc,
      bcc,
      attachPdf,
    });

    sendSuccess(res, { sent: true }, 'Invoice email sent successfully');
  });

  /**
   * Send invoice via SMS
   * POST /api/invoices/:id/send-sms
   */
  sendSMS = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const { phone, message } = req.body;

    await invoiceService.sendSMS(tenantId, id, { phone, message });

    sendSuccess(res, { sent: true }, 'Invoice SMS sent successfully');
  });

  /**
   * Generate PDF
   * GET /api/invoices/:id/pdf
   */
  generatePDF = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const { inline } = req.query;

    const invoice = await invoiceService.getById(tenantId, id);
    const pdfBuffer = await generateInvoicePDF(invoice, {
      currency: process.env.INVOICE_CURRENCY,
      locale: process.env.INVOICE_LOCALE,
    });

    const dispositionType =
      typeof inline === 'string' && inline.toLowerCase() === 'true' ? 'inline' : 'attachment';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `${dispositionType}; filename="${invoice.invoiceNumber}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length.toString());

    return res.send(pdfBuffer);
  });
}

export const invoiceController = new InvoiceController();

