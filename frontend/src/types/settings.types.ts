// Store types
export interface StoreAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface StoreContact {
  phone?: string;
  email?: string;
  website?: string;
}

export interface StoreBusinessDetails {
  registrationNumber?: string;
  taxId?: string;
  businessType?: string;
}

export interface StoreSettings {
  _id: string;
  name: string;
  code: string;
  tenantId?: string;
  address?: StoreAddress;
  phone?: string;
  email?: string;
  contact?: StoreContact;
  businessDetails?: StoreBusinessDetails;
  settings?: {
    timezone?: string;
    taxRate?: number;
    currency?: string;
  };
  timezone?: string;
  currency?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStoreRequest {
  name: string;
  code: string;
  address?: StoreAddress;
  phone?: string;
  email?: string;
  contact?: StoreContact;
  businessDetails?: StoreBusinessDetails;
  settings?: {
    timezone?: string;
    taxRate?: number;
    currency?: string;
  };
  timezone?: string;
  currency?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface UpdateStoreRequest extends Partial<CreateStoreRequest> {
  isActive?: boolean;
}

// Business settings
export interface BusinessSettings {
  timezone: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  fiscalYearStart?: string;
  businessHours?: Record<string, { open: string; close: string }>;
}

// Tax settings
export interface TaxSettings {
  enabled: boolean;
  defaultRate: number;
  taxName: string;
  taxNumber?: string;
  includedInPrice: boolean;
  showTaxBreakdown: boolean;
}

// Receipt settings
export type ReceiptTemplate = 'classic' | 'modern' | 'compact';

export interface ReceiptSettings {
  headerText: string;
  footerText: string;
  showLogo: boolean;
  showBarcode: boolean;
  logoUrl?: string;
  showQRCode: boolean;
  paperSize: 'A4' | '80mm' | '58mm';
  template: ReceiptTemplate;
  accentColor: string;
  showStoreDetails: boolean;
  showCustomerDetails: boolean;
  showCashier: boolean;
  showItemNotes: boolean;
  showDiscounts: boolean;
  showTaxBreakdown: boolean;
  showPaymentSummary: boolean;
  showNotes: boolean;
}

// POS settings
export interface POSSettings {
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
}

// Communication settings
export type CommunicationTestResult = 'success' | 'failure';

export interface EmailCommunicationConfig {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  fromEmail: string;
  replyTo: string;
  passwordSet: boolean;
  lastTestedAt?: string;
  lastTestResult?: CommunicationTestResult;
}

export interface SmsCommunicationConfig {
  enabled: boolean;
  provider: 'twilio';
  accountSid: string;
  fromNumber: string;
  authTokenSet: boolean;
  lastTestedAt?: string;
  lastTestResult?: CommunicationTestResult;
}

export interface CommunicationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  emailConfig: EmailCommunicationConfig;
  smsConfig: SmsCommunicationConfig;
}

export interface UpdateCommunicationSettingsRequest {
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  emailConfig?: {
    enabled?: boolean;
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    fromEmail?: string;
    replyTo?: string;
    password?: string | null;
  };
  smsConfig?: {
    enabled?: boolean;
    provider?: 'twilio';
    accountSid?: string;
    fromNumber?: string;
    authToken?: string | null;
  };
}

export type PaymentTestResult = 'success' | 'failure';

export interface StripeSettings {
  enabled: boolean;
  publishableKey: string;
  secretKeySet: boolean;
  webhookSecretSet: boolean;
  lastTestedAt?: string;
  lastTestResult?: PaymentTestResult;
}

export interface PaymentSettings {
  allowCash: boolean;
  allowCard: boolean;
  allowBankTransfer: boolean;
  allowStoreCredit: boolean;
  requireSignature: boolean;
  autoCapture: boolean;
  stripe: StripeSettings;
}

export interface UpdatePaymentSettingsRequest {
  allowCash?: boolean;
  allowCard?: boolean;
  allowBankTransfer?: boolean;
  allowStoreCredit?: boolean;
  requireSignature?: boolean;
  autoCapture?: boolean;
  stripe?: {
    enabled?: boolean;
    publishableKey?: string;
    secretKey?: string | null;
    webhookSecret?: string | null;
  };
}

export interface IntegrationSettings {
  ecommerce: {
    shopify: {
      enabled: boolean;
      storeDomain: string;
      accessTokenSet: boolean;
    };
  };
  accounting: {
    quickbooks: {
      enabled: boolean;
      realmId: string;
      clientId: string;
      clientSecretSet: boolean;
    };
  };
  crm: {
    hubspot: {
      enabled: boolean;
      apiKeySet: boolean;
    };
  };
  webhooks: {
    enabled: boolean;
    url: string;
    secretSet: boolean;
    lastTestedAt?: string;
    lastTestResult?: 'success' | 'failure';
  };
}

export interface UpdateIntegrationSettingsRequest {
  ecommerce?: {
    shopify?: {
      enabled?: boolean;
      storeDomain?: string;
      accessToken?: string | null;
    };
  };
  accounting?: {
    quickbooks?: {
      enabled?: boolean;
      realmId?: string;
      clientId?: string;
      clientSecret?: string | null;
    };
  };
  crm?: {
    hubspot?: {
      enabled?: boolean;
      apiKey?: string | null;
    };
  };
  webhooks?: {
    enabled?: boolean;
    url?: string;
    secret?: string | null;
  };
}

export interface ComplianceSettings {
  requireTwoFactor: boolean;
  sessionTimeoutMinutes: number;
  dataRetentionDays: number;
  allowDataExport: boolean;
  autoPurgeAuditLogs: boolean;
  auditNotificationEmails: string[];
}

export type UpdateComplianceSettingsRequest = Partial<ComplianceSettings>;

