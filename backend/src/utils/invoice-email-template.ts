import type { IInvoice } from '../models/invoice.model';

interface RenderInvoiceEmailOptions {
  message?: string;
  portalUrl?: string;
  locale?: string;
  currency?: string;
}

const formatCurrency = (value: number, locale = 'en-US', currency = 'USD') =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const formatDate = (value?: Date | string, locale = 'en-US') => {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
};

export const renderInvoiceEmail = (
  invoiceInput: IInvoice,
  options: RenderInvoiceEmailOptions = {}
): string => {
  const locale = options.locale || process.env.INVOICE_LOCALE || process.env.APP_LOCALE || 'en-US';
  const currency =
    options.currency || process.env.INVOICE_CURRENCY || process.env.DEFAULT_CURRENCY || 'USD';

  const invoice =
    typeof invoiceInput.toObject === 'function'
      ? (invoiceInput.toObject({ getters: true, virtuals: true }) as IInvoice)
      : invoiceInput;

  const customerName = invoice.to?.customerName || invoice.to?.address?.name || 'Customer';
  const totalFormatted = formatCurrency(invoice.total || 0, locale, currency);
  const dueFormatted = formatCurrency(invoice.amountDue || 0, locale, currency);

  const itemsHtml = (invoice.items || [])
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <div style="font-weight: 600; color: #111827;">${item.productName || item.description}</div>
            ${item.description && item.description !== item.productName ? `<div style="color: #6b7280; font-size: 12px; margin-top: 4px;">${item.description}</div>` : ''}
          </td>
          <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
          <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">${formatCurrency(item.unitPrice || 0, locale, currency)}</td>
          <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${formatCurrency(item.total || 0, locale, currency)}</td>
        </tr>
      `
    )
    .join('');

  const portalLink = options.portalUrl
    ? `<a href="${options.portalUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;border-radius:6px;color:#fff;font-weight:600;text-decoration:none;margin-top:24px;">View Invoice</a>`
    : '';

  const customMessage = options.message
    ? `<div style="background:#f8fafc;padding:16px;border-radius:8px;margin-bottom:24px;border:1px solid #e2e8f0;color:#0f172a;">${options.message}</div>`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invoice ${invoice.invoiceNumber}</title>
  </head>
  <body style="margin:0;padding:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',sans-serif;background:#f1f5f9;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding:32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 10px 35px rgba(15,23,42,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#2563eb 0%,#7c3aed 100%);padding:32px;color:#fff;">
                <div style="font-size:14px;letter-spacing:0.1em;text-transform:uppercase;opacity:0.9;">Invoice</div>
                <div style="font-size:30px;font-weight:700;margin-top:4px;">${invoice.from?.businessName || 'Your Business'}</div>
                ${invoice.invoiceNumber ? `<div style="margin-top:16px;font-size:16px;font-weight:500;">Invoice #${invoice.invoiceNumber}</div>` : ''}
                <div style="margin-top:8px;font-size:13px;opacity:0.9;">Issued on ${formatDate(invoice.date, locale)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <div style="font-size:16px;font-weight:600;color:#0f172a;margin-bottom:16px;">Hi ${customerName},</div>
                ${customMessage}
                <div style="color:#475569;font-size:14px;line-height:1.6;margin-bottom:24px;">
                  Please find your invoice details below. The total balance due is
                  <strong style="color:#0f172a;">${totalFormatted}</strong>.
                </div>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                  <tr style="background:#f8fafc;">
                    <td style="padding:16px;font-weight:600;color:#334155;">Billed To</td>
                    <td style="padding:16px;font-weight:600;color:#334155;">Summary</td>
                  </tr>
                  <tr>
                    <td style="padding:16px;color:#475569;font-size:13px;line-height:1.6;">
                      ${customerName}<br />
                      ${invoice.to?.address?.line1 || ''}<br />
                      ${invoice.to?.address?.city || ''} ${invoice.to?.address?.state || ''} ${invoice.to?.address?.zipCode || ''}<br />
                      ${invoice.to?.address?.country || ''}<br />
                      ${invoice.to?.address?.email || ''}<br />
                      ${invoice.to?.address?.phone || ''}
                    </td>
                    <td style="padding:16px;color:#475569;font-size:13px;line-height:1.8;">
                      <div><strong>Status:</strong> ${invoice.status?.toUpperCase() || 'PENDING'}</div>
                      <div><strong>Issued:</strong> ${formatDate(invoice.date, locale)}</div>
                      ${
                        invoice.dueDate
                          ? `<div><strong>Due:</strong> ${formatDate(invoice.dueDate, locale)}</div>`
                          : ''
                      }
                      <div><strong>Amount Due:</strong> ${dueFormatted}</div>
                    </td>
                  </tr>
                </table>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
                  <thead>
                    <tr style="background:#f8fafc;color:#0f172a;font-weight:600;text-align:left;">
                      <th style="padding:14px;">Item</th>
                      <th style="padding:14px;text-align:right;">Qty</th>
                      <th style="padding:14px;text-align:right;">Unit Price</th>
                      <th style="padding:14px;text-align:right;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml || `<tr><td colspan="4" style="padding:14px;text-align:center;color:#94a3b8;">No line items</td></tr>`}
                  </tbody>
                </table>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
                  <tr>
                    <td></td>
                    <td style="width:220px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding:8px 0;color:#475569;">Subtotal</td>
                          <td style="padding:8px 0;text-align:right;font-weight:600;color:#0f172a;">${formatCurrency(invoice.subtotal || 0, locale, currency)}</td>
                        </tr>
                        ${
                          invoice.totalDiscount
                            ? `<tr>
                                <td style="padding:8px 0;color:#475569;">Discounts</td>
                                <td style="padding:8px 0;text-align:right;font-weight:600;color:#dc2626;">-${formatCurrency(invoice.totalDiscount || 0, locale, currency)}</td>
                              </tr>`
                            : ''
                        }
                        ${
                          invoice.totalTax
                            ? `<tr>
                                <td style="padding:8px 0;color:#475569;">Tax</td>
                                <td style="padding:8px 0;text-align:right;font-weight:600;color:#0f172a;">${formatCurrency(invoice.totalTax || 0, locale, currency)}</td>
                              </tr>`
                            : ''
                        }
                        <tr>
                          <td style="padding:12px 0;border-top:1px solid #e2e8f0;font-weight:700;color:#0f172a;">Total</td>
                          <td style="padding:12px 0;border-top:1px solid #e2e8f0;text-align:right;font-weight:700;color:#0f172a;">${totalFormatted}</td>
                        </tr>
                        ${
                          invoice.amountPaid
                            ? `<tr>
                                <td style="padding:8px 0;color:#475569;">Payments</td>
                                <td style="padding:8px 0;text-align:right;font-weight:600;color:#16a34a;">-${formatCurrency(invoice.amountPaid || 0, locale, currency)}</td>
                              </tr>`
                            : ''
                        }
                        <tr>
                          <td style="padding:12px 0;font-weight:600;color:#0f172a;">Amount Due</td>
                          <td style="padding:12px 0;text-align:right;font-weight:700;color:#f97316;">${dueFormatted}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                ${portalLink}
                <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;text-align:center;">
                  ${invoice.footer || 'Thank you for your business.'}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
};


