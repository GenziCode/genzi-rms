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
    showTaxBreakdown: boolean;
  };

  // Receipt Settings
  receipt: {
    headerText?: string;
    footerText?: string;
    showLogo: boolean;
    showTaxId: boolean;
    showBarcode: boolean;
    showBarcode: boolean;
    showQRCode: boolean;
    paperSize: 'A4' | '80mm' | '58mm';
    logoUrl?: string;
    accentColor: string;
    template: 'classic' | 'modern' | 'compact';
    showStoreDetails: boolean;
    showCustomerDetails: boolean;
    showCashier: boolean;
    showItemNotes: boolean;
    showDiscounts: boolean;
    showTaxBreakdown: boolean;
    showPaymentSummary: boolean;
    showNotes: boolean;
  };

  // POS Settings
  pos: {
    autoLogoutMinutes: number;
    soundEnabled: boolean;
    barcodeScanner: boolean;
    customerDisplayEnabled: boolean;
    printReceiptAutomatically: boolean;
    enableBarcodeScanner: boolean;
    autoComplete: boolean;
    playSound: boolean;
    showCostPrice: boolean;
    requireCustomer: boolean;
    allowNegativeStock: boolean;
    quickPaymentButtons: number[];
    defaultPaymentMethod: 'cash' | 'card' | 'mobile' | 'bank';
  };

  // Notifications
  notifications: {
    lowStockAlert: boolean;
    dailySalesReport: boolean;
    weeklyReport: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    emailConfig: {
      enabled: boolean;
      host?: string;
      port?: number;
      secure: boolean;
      user?: string;
      password?: string;
      fromEmail?: string;
      replyTo?: string;
      lastTestedAt?: Date;
      lastTestResult?: 'success' | 'failure';
    };
    smsConfig: {
      enabled: boolean;
      provider: 'twilio';
      accountSid?: string;
      authToken?: string;
      fromNumber?: string;
      lastTestedAt?: Date;
      lastTestResult?: 'success' | 'failure';
    };
  };

  // Payments
  payments: {
    allowCash: boolean;
    allowCard: boolean;
    allowBankTransfer: boolean;
    allowStoreCredit: boolean;
    requireSignature: boolean;
    autoCapture: boolean;
    stripe: {
      enabled: boolean;
      publishableKey?: string;
      secretKey?: string;
      webhookSecret?: string;
      lastTestedAt?: Date;
      lastTestResult?: 'success' | 'failure';
    };
  };

  // Integrations
  integrations: {
    ecommerce: {
      shopify: {
        enabled: boolean;
        storeDomain?: string;
        accessToken?: string;
      };
    };
    accounting: {
      quickbooks: {
        enabled: boolean;
        realmId?: string;
        clientId?: string;
        clientSecret?: string;
      };
    };
    crm: {
      hubspot: {
        enabled: boolean;
        apiKey?: string;
      };
    };
    webhooks: {
      enabled: boolean;
      url?: string;
      secret?: string;
      lastTestedAt?: Date;
      lastTestResult?: 'success' | 'failure';
    };
  };

  // Compliance & Security
  compliance: {
    requireTwoFactor: boolean;
    sessionTimeoutMinutes: number;
    dataRetentionDays: number;
    allowDataExport: boolean;
    autoPurgeAuditLogs: boolean;
    auditNotificationEmails: string[];
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
      showTaxBreakdown: { type: Boolean, default: true },
    },
    receipt: {
      headerText: String,
      footerText: String,
      showLogo: { type: Boolean, default: true },
      showTaxId: { type: Boolean, default: true },
      showBarcode: { type: Boolean, default: true },
      showQRCode: { type: Boolean, default: false },
      paperSize: { type: String, enum: ['A4', '80mm', '58mm'], default: '80mm' },
      logoUrl: String,
      accentColor: { type: String, default: '#2563eb' },
      template: { type: String, enum: ['classic', 'modern', 'compact'], default: 'classic' },
      showStoreDetails: { type: Boolean, default: true },
      showCustomerDetails: { type: Boolean, default: true },
      showCashier: { type: Boolean, default: true },
      showItemNotes: { type: Boolean, default: false },
      showDiscounts: { type: Boolean, default: true },
      showTaxBreakdown: { type: Boolean, default: true },
      showPaymentSummary: { type: Boolean, default: true },
      showNotes: { type: Boolean, default: true },
    },
    pos: {
      autoLogoutMinutes: { type: Number, default: 30 },
      soundEnabled: { type: Boolean, default: true },
      barcodeScanner: { type: Boolean, default: false },
      customerDisplayEnabled: { type: Boolean, default: false },
      printReceiptAutomatically: { type: Boolean, default: true },
      enableBarcodeScanner: { type: Boolean, default: true },
      autoComplete: { type: Boolean, default: true },
      playSound: { type: Boolean, default: true },
      showCostPrice: { type: Boolean, default: false },
      requireCustomer: { type: Boolean, default: false },
      allowNegativeStock: { type: Boolean, default: false },
      quickPaymentButtons: { type: [Number], default: [10, 20, 50, 100] },
      defaultPaymentMethod: {
        type: String,
        enum: ['cash', 'card', 'mobile', 'bank'],
        default: 'cash',
      },
    },
    notifications: {
      lowStockAlert: { type: Boolean, default: true },
      dailySalesReport: { type: Boolean, default: false },
      weeklyReport: { type: Boolean, default: false },
      emailNotifications: { type: Boolean, default: false },
      smsNotifications: { type: Boolean, default: false },
      emailConfig: {
        enabled: { type: Boolean, default: false },
        host: String,
        port: { type: Number, default: 587 },
        secure: { type: Boolean, default: false },
        user: String,
        password: String,
        fromEmail: String,
        replyTo: String,
        lastTestedAt: Date,
        lastTestResult: { type: String, enum: ['success', 'failure'] },
      },
      smsConfig: {
        enabled: { type: Boolean, default: false },
        provider: { type: String, enum: ['twilio'], default: 'twilio' },
        accountSid: String,
        authToken: String,
        fromNumber: String,
        lastTestedAt: Date,
        lastTestResult: { type: String, enum: ['success', 'failure'] },
      },
    },
    payments: {
      allowCash: { type: Boolean, default: true },
      allowCard: { type: Boolean, default: true },
      allowBankTransfer: { type: Boolean, default: false },
      allowStoreCredit: { type: Boolean, default: false },
      requireSignature: { type: Boolean, default: false },
      autoCapture: { type: Boolean, default: true },
      stripe: {
        enabled: { type: Boolean, default: false },
        publishableKey: String,
        secretKey: String,
        webhookSecret: String,
        lastTestedAt: Date,
        lastTestResult: { type: String, enum: ['success', 'failure'] },
      },
    },
    integrations: {
      ecommerce: {
        shopify: {
          enabled: { type: Boolean, default: false },
          storeDomain: String,
          accessToken: String,
        },
      },
      accounting: {
        quickbooks: {
          enabled: { type: Boolean, default: false },
          realmId: String,
          clientId: String,
          clientSecret: String,
        },
      },
      crm: {
        hubspot: {
          enabled: { type: Boolean, default: false },
          apiKey: String,
        },
      },
      webhooks: {
        enabled: { type: Boolean, default: false },
        url: String,
        secret: String,
        lastTestedAt: Date,
        lastTestResult: { type: String, enum: ['success', 'failure'] },
      },
    },
    compliance: {
      requireTwoFactor: { type: Boolean, default: false },
      sessionTimeoutMinutes: { type: Number, default: 30 },
      dataRetentionDays: { type: Number, default: 365 },
      allowDataExport: { type: Boolean, default: true },
      autoPurgeAuditLogs: { type: Boolean, default: false },
      auditNotificationEmails: { type: [String], default: [] },
    },
    updatedBy: Schema.Types.ObjectId,
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  }
);
