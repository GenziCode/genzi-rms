/**
 * Invoice & Document Types
 * Comprehensive types for all business documents
 */

export type DocumentType = 
  | 'sale_invoice'
  | 'purchase_order'
  | 'quotation'
  | 'proforma_invoice'
  | 'credit_note'
  | 'debit_note'
  | 'delivery_note'
  | 'receipt';

export type DocumentStatus = 
  | 'draft'
  | 'pending'
  | 'sent'
  | 'paid'
  | 'partial'
  | 'overdue'
  | 'cancelled'
  | 'void';

export type InvoiceTemplate = 
  | 'modern'
  | 'classic'
  | 'minimal'
  | 'professional'
  | 'colorful'
  | 'thermal';

export interface InvoiceItem {
  productId: string;
  productName: string;
  sku?: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount?: number;
  discountType?: 'fixed' | 'percentage';
  taxRate?: number;
  taxAmount: number;
  subtotal: number;
  total: number;
}

export interface InvoicePayment {
  method: 'cash' | 'card' | 'mobile' | 'bank' | 'cheque' | 'credit';
  amount: number;
  reference?: string;
  date: string;
}

export interface InvoiceAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface Invoice {
  // Core
  id: string;
  invoiceNumber: string;
  type: DocumentType;
  status: DocumentStatus;
  
  // Dates
  date: string;
  dueDate?: string;
  
  // Parties
  from: {
    businessName: string;
    address: InvoiceAddress;
    taxId?: string;
    registrationNumber?: string;
    logo?: string;
    website?: string;
  };
  
  to: {
    customerId?: string;
    customerName: string;
    address: InvoiceAddress;
    taxId?: string;
  };
  
  // Items
  items: InvoiceItem[];
  
  // Amounts
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  shippingCost?: number;
  adjustments?: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  
  // Payments
  payments?: InvoicePayment[];
  
  // Additional Info
  notes?: string;
  terms?: string;
  footer?: string;
  
  // References
  referenceNumber?: string;
  poNumber?: string;
  salesPerson?: string;
  
  // Tracking
  qrCode?: string;
  barcode?: string;
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  type: InvoiceTemplate;
  description: string;
  thumbnail: string;
  isPremium?: boolean;
}

export interface DocumentSettings {
  // Numbering
  invoicePrefix: string;
  quotationPrefix: string;
  poPrefix: string;
  autoIncrement: boolean;
  nextInvoiceNumber: number;
  
  // Defaults
  defaultTemplate: InvoiceTemplate;
  defaultTerms: string;
  defaultNotes: string;
  defaultDueDays: number;
  
  // Features
  showLogo: boolean;
  showBarcode: boolean;
  showQRCode: boolean;
  showSignature: boolean;
  showStamp: boolean;
  
  // Branding
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  
  // Footer
  footerText: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

