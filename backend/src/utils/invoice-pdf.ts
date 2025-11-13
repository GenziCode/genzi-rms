import PDFDocument from 'pdfkit';
import type { IInvoice, IInvoiceItem, IInvoicePayment } from '../models/invoice.model';

interface GenerateInvoicePdfOptions {
  currency?: string;
  locale?: string;
}

interface NormalizedInvoice extends Omit<IInvoice, keyof IInvoice['toObject']> {
  items: IInvoiceItem[];
  payments?: IInvoicePayment[];
}

const DEFAULT_LOCALE = process.env.INVOICE_LOCALE || process.env.APP_LOCALE || 'en-US';
const DEFAULT_CURRENCY =
  process.env.INVOICE_CURRENCY || process.env.DEFAULT_CURRENCY || 'USD';

const toPlainObject = (invoice: IInvoice): NormalizedInvoice => {
  if (typeof invoice.toObject === 'function') {
    return invoice.toObject({ getters: true, virtuals: true }) as unknown as NormalizedInvoice;
  }
  return invoice as unknown as NormalizedInvoice;
};

const formatCurrency = (value: number, currency: string, locale: string) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value || 0);
};

const formatDate = (value?: Date | string, locale = DEFAULT_LOCALE) => {
  if (!value) {
    return '—';
  }

  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
};

const drawSectionTitle = (doc: PDFDocument, title: string, y?: number) => {
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#111827')
    .text(title.toUpperCase(), { underline: false, continued: false, lineGap: 4, y });
  doc.moveDown(0.3);
  doc.fillColor('#6B7280').font('Helvetica').fontSize(10);
};

const drawAddressBlock = (
  doc: PDFDocument,
  heading: string,
  name: string,
  addressLines: string[],
  contactLines: string[],
  x: number,
  y: number
) => {
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(11).text(heading, x, y);
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .text(name, x, y + 16, { continued: false });

  doc.font('Helvetica').fontSize(10).fillColor('#4B5563');

  let offset = 32;
  addressLines
    .filter(Boolean)
    .forEach((line) => {
      doc.text(line!, x, y + offset);
      offset += 14;
    });

  contactLines
    .filter(Boolean)
    .forEach((line) => {
      doc.text(line!, x, y + offset);
      offset += 14;
    });
};

const drawTableHeader = (doc: PDFDocument, y: number) => {
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#111827');

  doc.text('Item', 50, y, { width: 220 });
  doc.text('Qty', 280, y, { width: 40, align: 'right' });
  doc.text('Unit Price', 330, y, { width: 80, align: 'right' });
  doc.text('Tax', 420, y, { width: 70, align: 'right' });
  doc.text('Line Total', 500, y, { width: 80, align: 'right' });

  doc
    .moveTo(50, y + 15)
    .lineTo(550, y + 15)
    .strokeColor('#E5E7EB')
    .lineWidth(1)
    .stroke();
};

const drawItemRow = (
  doc: PDFDocument,
  item: IInvoiceItem,
  currency: string,
  locale: string,
  y: number
) => {
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#111827')
    .text(item.productName, 50, y, { width: 220 });

  if (item.description) {
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#6B7280')
      .text(item.description, 50, doc.y, { width: 220 });
  }

  const qty = item.quantity % 1 === 0 ? item.quantity.toString() : item.quantity.toFixed(2);

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#111827')
    .text(qty, 280, y, { width: 40, align: 'right' });

  doc.text(formatCurrency(item.unitPrice, currency, locale), 330, y, {
    width: 80,
    align: 'right',
  });

  const taxDisplay =
    item.taxAmount && item.taxAmount > 0
      ? formatCurrency(item.taxAmount, currency, locale)
      : '—';

  doc.text(taxDisplay, 420, y, { width: 70, align: 'right' });

  doc.text(formatCurrency(item.total, currency, locale), 500, y, {
    width: 80,
    align: 'right',
  });

  const rowBottom = Math.max(
    doc.y,
    y + doc.heightOfString(item.productName || '', { width: 220 }) + 6
  );

  doc
    .moveTo(50, rowBottom + 4)
    .lineTo(550, rowBottom + 4)
    .strokeColor('#F3F4F6')
    .lineWidth(0.5)
    .stroke();

  return rowBottom + 10;
};

const drawTotals = (
  doc: PDFDocument,
  invoice: NormalizedInvoice,
  currency: string,
  locale: string,
  y: number
) => {
  const startX = 340;
  const lineHeight = 16;

  const rows: Array<[string, number, boolean?]> = [
    ['Subtotal', invoice.subtotal],
  ];

  if (invoice.totalDiscount && invoice.totalDiscount > 0) {
    rows.push(['Discount', invoice.totalDiscount * -1, true]);
  }

  if (invoice.totalTax && invoice.totalTax > 0) {
    rows.push(['Tax', invoice.totalTax]);
  }

  if (invoice.shippingCost && invoice.shippingCost > 0) {
    rows.push(['Shipping', invoice.shippingCost]);
  }

  if (invoice.adjustments && invoice.adjustments !== 0) {
    rows.push(['Adjustments', invoice.adjustments, invoice.adjustments < 0]);
  }

  rows.push(['Total', invoice.total]);

  if (invoice.amountPaid && invoice.amountPaid > 0) {
    rows.push(['Amount Paid', invoice.amountPaid * -1, true]);
  }

  rows.push(['Amount Due', invoice.amountDue]);

  rows.forEach(([label, value, isNegative], index) => {
    const isGrandTotal = label === 'Amount Due' || label === 'Total';
    const displayValue = isNegative
      ? `-${formatCurrency(Math.abs(value), currency, locale)}`
      : formatCurrency(value, currency, locale);

    doc
      .font(isGrandTotal ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(isGrandTotal ? 12 : 10)
      .fillColor('#111827')
      .text(label, startX, y + index * lineHeight, { width: 120 });

    doc
      .font(isGrandTotal ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(isGrandTotal ? 12 : 10)
      .fillColor(isNegative ? '#DC2626' : '#111827')
      .text(displayValue, startX + 120, y + index * lineHeight, {
        width: 120,
        align: 'right',
      });
  });
};

const drawPayments = (
  doc: PDFDocument,
  payments: IInvoicePayment[] | undefined,
  currency: string,
  locale: string,
  y: number
) => {
  if (!payments || payments.length === 0) {
    return;
  }

  drawSectionTitle(doc, 'Payments', y);

  let offsetY = doc.y;

  payments.forEach((payment) => {
    const dateLabel = formatDate(payment.date, locale);
    const description = `${payment.method.toUpperCase()} • ${dateLabel}`;
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#111827')
      .text(description, 50, offsetY, { width: 220 });

    if (payment.reference) {
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#6B7280')
        .text(`Reference: ${payment.reference}`, 50, doc.y, { width: 220 });
    }

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#16A34A')
      .text(formatCurrency(payment.amount, currency, locale), 340, offsetY, {
        width: 120,
        align: 'right',
      });

    offsetY = Math.max(offsetY + 18, doc.y + 6);
  });
};

export const generateInvoicePDF = async (
  invoiceInput: IInvoice,
  options: GenerateInvoicePdfOptions = {}
): Promise<Buffer> => {
  const invoice = toPlainObject(invoiceInput);
  const locale = options.locale || DEFAULT_LOCALE;
  const currency = options.currency || DEFAULT_CURRENCY;

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const chunks: Uint8Array[] = [];

  return await new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    doc.on('end', () => {
      resolve(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))));
    });
    doc.on('error', (error) => reject(error));

    // Header
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(20).text(invoice.from.businessName);

    if (invoice.from.website) {
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#2563EB')
        .text(invoice.from.website, { link: invoice.from.website, underline: true });
    }

    doc.moveDown(0.5);
    doc
      .font('Helvetica-Bold')
      .fontSize(22)
      .fillColor('#111827')
      .text('INVOICE', 400, 40, { align: 'right' });

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#4B5563')
      .text(`Invoice #: ${invoice.invoiceNumber}`, 400, 70, { align: 'right' })
      .text(`Date: ${formatDate(invoice.date, locale)}`, { align: 'right' })
      .text(`Status: ${invoice.status.toUpperCase()}`, { align: 'right' });

    if (invoice.dueDate) {
      doc.text(`Due: ${formatDate(invoice.dueDate, locale)}`, { align: 'right' });
    }

    doc.moveDown(1.2);

    const fromAddressLines = [
      invoice.from.address.line1,
      invoice.from.address.line2,
      `${invoice.from.address.city}, ${invoice.from.address.state} ${invoice.from.address.zipCode}`,
      invoice.from.address.country,
    ].filter(Boolean) as string[];

    const fromContactLines = [
      invoice.from.address.phone && `Phone: ${invoice.from.address.phone}`,
      invoice.from.address.email && `Email: ${invoice.from.address.email}`,
      invoice.from.taxId && `Tax ID: ${invoice.from.taxId}`,
      invoice.from.registrationNumber && `Reg #: ${invoice.from.registrationNumber}`,
    ].filter(Boolean) as string[];

    const toAddressLines = [
      invoice.to.address.line1,
      invoice.to.address.line2,
      `${invoice.to.address.city}, ${invoice.to.address.state} ${invoice.to.address.zipCode}`,
      invoice.to.address.country,
    ].filter(Boolean) as string[];

    const toContactLines = [
      invoice.to.address.phone && `Phone: ${invoice.to.address.phone}`,
      invoice.to.address.email && `Email: ${invoice.to.address.email}`,
      invoice.to.taxId && `Tax ID: ${invoice.to.taxId}`,
    ].filter(Boolean) as string[];

    drawAddressBlock(
      doc,
      'Bill From',
      invoice.from.businessName,
      fromAddressLines,
      fromContactLines,
      50,
      doc.y
    );

    drawAddressBlock(
      doc,
      'Bill To',
      invoice.to.customerName,
      toAddressLines,
      toContactLines,
      300,
      doc.y
    );

    doc.moveDown(4);

    // Items table
    let itemsY = doc.y;
    drawTableHeader(doc, itemsY);
    itemsY += 25;

    invoice.items.forEach((item) => {
      if (itemsY > doc.page.height - 120) {
        doc.addPage();
        itemsY = 50;
        drawTableHeader(doc, itemsY);
        itemsY += 25;
      }
      itemsY = drawItemRow(doc, item, currency, locale, itemsY);
    });

    doc.moveDown(2);

    const totalsY = Math.max(itemsY + 10, doc.y);
    drawTotals(doc, invoice, currency, locale, totalsY);

    if (invoice.payments && invoice.payments.length > 0) {
      const paymentsY = totalsY + 120;
      drawPayments(doc, invoice.payments, currency, locale, paymentsY);
    }

    // Notes & Terms
    let footerY = Math.max(doc.y + 30, totalsY + 140);

    if (invoice.notes) {
      drawSectionTitle(doc, 'Notes', footerY);
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#4B5563')
        .text(invoice.notes, { width: 480 });
      footerY = doc.y + 16;
    }

    if (invoice.terms) {
      drawSectionTitle(doc, 'Terms & Conditions', footerY);
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#4B5563')
        .text(invoice.terms, { width: 480 });
      footerY = doc.y + 16;
    }

    doc
      .moveTo(40, doc.page.height - 80)
      .lineTo(doc.page.width - 40, doc.page.height - 80)
      .strokeColor('#E5E7EB')
      .lineWidth(0.5)
      .stroke();

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#94A3B8')
      .text(invoice.footer || 'Thank you for your business.', 40, doc.page.height - 70, {
        align: 'center',
      });

    doc.end();
  });
};


