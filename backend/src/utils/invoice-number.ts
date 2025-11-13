import { DocumentType } from '../models/invoice.model';
import { getTenantConnection } from '../config/database';
import { InvoiceSchema } from '../models/invoice.model';
import { logger } from './logger';

interface InvoiceNumberConfig {
  prefix: string;
  length: number; // Total length of numeric part (e.g., 6 for 000001)
}

const prefixMap: Record<DocumentType, string> = {
  sale_invoice: 'INV',
  quotation: 'QUO',
  proforma_invoice: 'PI',
  purchase_order: 'PO',
  credit_note: 'CN',
  debit_note: 'DN',
  delivery_note: 'DL',
  receipt: 'RCP',
};

/**
 * Generate next invoice number for a tenant
 * Format: PREFIX-YYYYMMDD-000001
 * Example: INV-20241111-000001
 */
export async function generateInvoiceNumber(
  tenantId: string,
  type: DocumentType = 'sale_invoice'
): Promise<string> {
  const prefix = prefixMap[type] || 'DOC';
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  
  try {
    const tenantConn = await getTenantConnection(tenantId);
    const Invoice = tenantConn.model('Invoice', InvoiceSchema);

    // Find the latest invoice number for today with this prefix
    const pattern = new RegExp(`^${prefix}-${dateStr}-`);
    
    const latestInvoice = await Invoice.findOne({
      invoiceNumber: pattern,
    })
      .sort({ invoiceNumber: -1 })
      .select('invoiceNumber')
      .lean();

    let nextNumber = 1;

    if (latestInvoice && latestInvoice.invoiceNumber) {
      // Extract the numeric part
      const parts = latestInvoice.invoiceNumber.split('-');
      const lastNumber = parseInt(parts[parts.length - 1], 10);
      nextNumber = lastNumber + 1;
    }

    // Pad with zeros (default 6 digits)
    const paddedNumber = nextNumber.toString().padStart(6, '0');
    
    const invoiceNumber = `${prefix}-${dateStr}-${paddedNumber}`;
    
    logger.info(`Generated invoice number: ${invoiceNumber} for tenant: ${tenantId}`);
    
    return invoiceNumber;
  } catch (error) {
    logger.error('Error generating invoice number:', error);
    // Fallback to timestamp-based number
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${dateStr}-${timestamp}`;
  }
}

/**
 * Validate invoice number format
 */
export function validateInvoiceNumber(invoiceNumber: string): boolean {
  // Format: PREFIX-YYYYMMDD-000000
  const pattern = /^[A-Z]{2,4}-\d{8}-\d{6}$/;
  return pattern.test(invoiceNumber);
}

/**
 * Parse invoice number to extract components
 */
export function parseInvoiceNumber(invoiceNumber: string): {
  prefix: string;
  date: string;
  sequence: string;
} | null {
  if (!validateInvoiceNumber(invoiceNumber)) {
    return null;
  }

  const parts = invoiceNumber.split('-');
  
  return {
    prefix: parts[0],
    date: parts[1],
    sequence: parts[2],
  };
}

/**
 * Get document type from invoice number prefix
 */
export function getTypeFromPrefix(prefix: string): DocumentType | null {
  const entry = Object.entries(prefixMap).find(([_, p]) => p === prefix);
  return entry ? (entry[0] as DocumentType) : null;
}

