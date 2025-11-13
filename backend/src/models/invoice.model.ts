import { Schema, Document } from 'mongoose';

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

export interface IInvoiceItem {
  productId: Schema.Types.ObjectId;
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

export interface IInvoicePayment {
  method: 'cash' | 'card' | 'mobile' | 'bank' | 'cheque' | 'credit';
  amount: number;
  reference?: string;
  date: Date;
}

export interface IInvoiceAddress {
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

export interface IInvoice extends Document {
  // Core
  invoiceNumber: string;
  type: DocumentType;
  status: DocumentStatus;
  
  // Dates
  date: Date;
  dueDate?: Date;
  
  // Parties
  from: {
    businessName: string;
    address: IInvoiceAddress;
    taxId?: string;
    registrationNumber?: string;
    logo?: string;
    website?: string;
  };
  
  to: {
    customerId?: Schema.Types.ObjectId;
    customerName: string;
    address: IInvoiceAddress;
    taxId?: string;
  };
  
  // Items
  items: IInvoiceItem[];
  
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
  payments?: IInvoicePayment[];
  
  // Additional Info
  notes?: string;
  terms?: string;
  footer?: string;
  
  // References
  referenceNumber?: string;
  poNumber?: string;
  salesPerson?: string;
  saleId?: Schema.Types.ObjectId;
  
  // Tracking
  qrCode?: string;
  barcode?: string;
  
  // Multi-tenant
  tenantId: Schema.Types.ObjectId;
  storeId?: Schema.Types.ObjectId;
  
  // Metadata
  createdBy: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  sku: String,
  description: String,
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  unit: {
    type: String,
    default: 'pcs',
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  discountType: {
    type: String,
    enum: ['fixed', 'percentage'],
    default: 'fixed',
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

const InvoicePaymentSchema = new Schema({
  method: {
    type: String,
    enum: ['cash', 'card', 'mobile', 'bank', 'cheque', 'credit'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  reference: String,
  date: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const AddressSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  line1: {
    type: String,
    required: true,
  },
  line2: String,
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  phone: String,
  email: String,
}, { _id: false });

export const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['sale_invoice', 'purchase_order', 'quotation', 'proforma_invoice', 'credit_note', 'debit_note', 'delivery_note', 'receipt'],
      default: 'sale_invoice',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'sent', 'paid', 'partial', 'overdue', 'cancelled', 'void'],
      default: 'draft',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    dueDate: Date,
    from: {
      businessName: {
        type: String,
        required: true,
      },
      address: {
        type: AddressSchema,
        required: true,
      },
      taxId: String,
      registrationNumber: String,
      logo: String,
      website: String,
    },
    to: {
      customerId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
      },
      customerName: {
        type: String,
        required: true,
      },
      address: {
        type: AddressSchema,
        required: true,
      },
      taxId: String,
    },
    items: {
      type: [InvoiceItemSchema],
      required: true,
      validate: {
        validator: (items: IInvoiceItem[]) => items.length > 0,
        message: 'Invoice must have at least one item',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    totalDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalTax: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    adjustments: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    amountDue: {
      type: Number,
      required: true,
      min: 0,
    },
    payments: [InvoicePaymentSchema],
    notes: String,
    terms: String,
    footer: String,
    referenceNumber: String,
    poNumber: String,
    salesPerson: String,
    saleId: {
      type: Schema.Types.ObjectId,
      ref: 'Sale',
    },
    qrCode: String,
    barcode: String,
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Tenant',
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
InvoiceSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ tenantId: 1, type: 1, status: 1 });
InvoiceSchema.index({ tenantId: 1, 'to.customerId': 1 });
InvoiceSchema.index({ tenantId: 1, date: -1 });
InvoiceSchema.index({ tenantId: 1, status: 1, dueDate: 1 });
InvoiceSchema.index({ barcode: 1 }, { sparse: true });
InvoiceSchema.index({ qrCode: 1 }, { sparse: true });

