import { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  tenantId: Schema.Types.ObjectId;

  // Store Information
  store: {
    name: string;
    logo?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    phone?: string;
    email?: string;
    website?: string;
    taxId?: string;
  };

  // Business Settings
  business: {
    timezone: string;
    currency: string;
    dateFormat: string;
    timeFormat: string;
    fiscalYearStart?: string; // MM-DD format
    businessHours?: {
      monday?: { open: string; close: string };
      tuesday?: { open: string; close: string };
      wednesday?: { open: string; close: string };
      thursday?: { open: string; close: string };
      friday?: { open: string; close: string };
      saturday?: { open: string; close: string };
      sunday?: { open: string; close: string };
    };
  };

  // Tax Configuration
  tax: {
    enabled: boolean;
    defaultRate: number;
    taxName: string; // "VAT", "GST", "Sales Tax", etc.
    taxNumber?: string;
    includedInPrice: boolean;
  };

  // Receipt Settings
  receipt: {
    headerText?: string;
    footerText?: string;
    showLogo: boolean;
    showTaxId: boolean;
    showQRCode: boolean;
    paperSize: 'A4' | '80mm' | '58mm';
  };

  // POS Settings
  pos: {
    autoLogoutMinutes: number;
    soundEnabled: boolean;
    barcodeScanner: boolean;
    customerDisplayEnabled: boolean;
    printReceiptAutomatically: boolean;
  };

  // Notifications
  notifications: {
    lowStockAlert: boolean;
    dailySalesReport: boolean;
    weeklyReport: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
  };

  updatedBy?: Schema.Types.ObjectId;
  updatedAt: Date;
}

export const SettingsSchema = new Schema<ISettings>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },
    store: {
      name: { type: String, required: true },
      logo: String,
      address: String,
      city: String,
      state: String,
      country: { type: String, default: 'USA' },
      postalCode: String,
      phone: String,
      email: String,
      website: String,
      taxId: String,
    },
    business: {
      timezone: { type: String, default: 'America/New_York' },
      currency: { type: String, default: 'USD' },
      dateFormat: { type: String, default: 'MM/DD/YYYY' },
      timeFormat: { type: String, default: '12h' },
      fiscalYearStart: String,
      businessHours: Schema.Types.Mixed,
    },
    tax: {
      enabled: { type: Boolean, default: true },
      defaultRate: { type: Number, default: 10, min: 0, max: 100 },
      taxName: { type: String, default: 'Tax' },
      taxNumber: String,
      includedInPrice: { type: Boolean, default: false },
    },
    receipt: {
      headerText: String,
      footerText: String,
      showLogo: { type: Boolean, default: true },
      showTaxId: { type: Boolean, default: true },
      showQRCode: { type: Boolean, default: false },
      paperSize: { type: String, enum: ['A4', '80mm', '58mm'], default: '80mm' },
    },
    pos: {
      autoLogoutMinutes: { type: Number, default: 30 },
      soundEnabled: { type: Boolean, default: true },
      barcodeScanner: { type: Boolean, default: false },
      customerDisplayEnabled: { type: Boolean, default: false },
      printReceiptAutomatically: { type: Boolean, default: true },
    },
    notifications: {
      lowStockAlert: { type: Boolean, default: true },
      dailySalesReport: { type: Boolean, default: false },
      weeklyReport: { type: Boolean, default: false },
      emailNotifications: { type: Boolean, default: false },
      smsNotifications: { type: Boolean, default: false },
    },
    updatedBy: Schema.Types.ObjectId,
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  }
);
