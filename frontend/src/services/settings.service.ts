import api from '@/lib/api';
import type {
  BusinessSettings,
  CommunicationSettings,
  CreateStoreRequest,
  POSSettings,
  ReceiptSettings,
  StoreSettings,
  TaxSettings,
  UpdateCommunicationSettingsRequest,
  PaymentSettings,
  IntegrationSettings,
  ComplianceSettings,
  UpdatePaymentSettingsRequest,
  UpdateIntegrationSettingsRequest,
  UpdateComplianceSettingsRequest,
  UpdateStoreRequest,
} from '@/types/settings.types';

const taxDefaults: TaxSettings = {
  enabled: true,
  defaultRate: 10,
  taxName: 'Tax',
  includedInPrice: false,
  showTaxBreakdown: true,
};

export const receiptSettingsDefaults: ReceiptSettings = {
  headerText: 'Thank you for your business!',
  footerText: 'Please come again',
  showLogo: true,
  showBarcode: true,
  logoUrl: undefined,
  showQRCode: false,
  paperSize: '80mm',
  template: 'classic',
  accentColor: '#2563eb',
  showStoreDetails: true,
  showCustomerDetails: true,
  showCashier: true,
  showItemNotes: false,
  showDiscounts: true,
  showTaxBreakdown: true,
  showPaymentSummary: true,
  showNotes: true,
};

const paymentSettingsDefaults: PaymentSettings = {
  allowCash: true,
  allowCard: true,
  allowBankTransfer: true,
  allowStoreCredit: true,
  requireSignature: false,
  autoCapture: true,
  supportedCurrencies: ['USD'],
  defaultCurrency: 'USD',
  paymentMethods: {
    cash: { enabled: true, currencies: ['USD'] },
    card: { enabled: true, surcharge: 2.5, surchargeType: 'percentage', currencies: ['USD'] },
    mobile: { enabled: true, surcharge: 1.5, surchargeType: 'percentage', currencies: ['USD'] },
    bank: { enabled: true, currencies: ['USD'] },
    credit: { enabled: true, currencies: ['USD'] },
    other: { enabled: true, currencies: ['USD'] },
  },
  stripe: {
    enabled: false,
    publishableKey: '',
    secretKeySet: false,
    webhookSecretSet: false,
  },
};

const posSettingsDefaults: POSSettings = {
  autoLogoutMinutes: 30,
  soundEnabled: true,
  barcodeScanner: false,
  customerDisplayEnabled: false,
  printReceiptAutomatically: true,
  enableBarcodeScanner: true,
  autoComplete: true,
  playSound: true,
  showCostPrice: false,
  requireCustomer: false,
  allowNegativeStock: false,
  quickPaymentButtons: [10, 20, 50, 100],
  defaultPaymentMethod: 'cash',
};

const sanitizePayload = <T extends Record<string, any>>(payload: T): T => {
  const cleaned = JSON.parse(JSON.stringify(payload ?? {}));
  return cleaned;
};

const prepareStorePayload = <T extends CreateStoreRequest | UpdateStoreRequest>(data: T): T => {
  const payload: any = { ...data };

  if (data.settings || data.timezone || data.currency) {
    payload.settings = {
      ...(data.settings ?? {}),
    };
    if (data.timezone) {
      payload.settings.timezone = data.timezone;
    }
    if (data.currency) {
      payload.settings.currency = data.currency;
    }
    if (payload.settings.taxRate === undefined) {
      delete payload.settings.taxRate;
    }
  }

  return sanitizePayload(payload);
};

const mapStoreResponse = (store: StoreSettings): StoreSettings => {
  const timezone = store.timezone ?? store.settings?.timezone ?? 'America/New_York';
  const currency = store.currency ?? store.settings?.currency ?? 'USD';
  const phone = store.phone ?? store.contact?.phone;
  const email = store.email ?? store.contact?.email;
  const contact =
    store.contact || phone || email
      ? {
          phone,
          email,
          website: store.contact?.website,
        }
      : undefined;

  return {
    ...store,
    phone,
    email,
    contact,
    timezone,
    currency,
    settings: {
      ...store.settings,
      timezone,
      currency,
    },
  };
};

const mergeReceiptSettings = (input?: Partial<ReceiptSettings>): ReceiptSettings => ({
  ...receiptSettingsDefaults,
  ...(input ?? {}),
});

const mergePosSettings = (input?: Partial<POSSettings>): POSSettings => ({
  ...posSettingsDefaults,
  ...(input ?? {}),
  quickPaymentButtons: input?.quickPaymentButtons?.length
    ? input.quickPaymentButtons
    : posSettingsDefaults.quickPaymentButtons,
});

const preparePaymentPayload = (data: UpdatePaymentSettingsRequest) => {
  if (!data) return undefined;
  const payload: UpdatePaymentSettingsRequest = {
    allowCash: data.allowCash,
    allowCard: data.allowCard,
    allowBankTransfer: data.allowBankTransfer,
    allowStoreCredit: data.allowStoreCredit,
    requireSignature: data.requireSignature,
    autoCapture: data.autoCapture,
    stripe: data.stripe
      ? sanitizePayload({
          enabled: data.stripe.enabled,
          publishableKey: data.stripe.publishableKey?.trim() || undefined,
          secretKey:
            data.stripe.secretKey === null
              ? null
              : data.stripe.secretKey?.trim() || undefined,
          webhookSecret:
            data.stripe.webhookSecret === null
              ? null
              : data.stripe.webhookSecret?.trim() || undefined,
        })
      : undefined,
  };

  return sanitizePayload(payload);
};

const prepareIntegrationPayload = (data: UpdateIntegrationSettingsRequest) => {
  if (!data) return undefined;
  const payload: UpdateIntegrationSettingsRequest = {
    ecommerce: data.ecommerce
      ? {
          shopify: data.ecommerce.shopify
            ? sanitizePayload({
                enabled: data.ecommerce.shopify.enabled,
                storeDomain: data.ecommerce.shopify.storeDomain?.trim() || undefined,
                accessToken:
                  data.ecommerce.shopify.accessToken === null
                    ? null
                    : data.ecommerce.shopify.accessToken?.trim() || undefined,
              })
            : undefined,
        }
      : undefined,
    accounting: data.accounting
      ? {
          quickbooks: data.accounting.quickbooks
            ? sanitizePayload({
                enabled: data.accounting.quickbooks.enabled,
                realmId: data.accounting.quickbooks.realmId?.trim() || undefined,
                clientId: data.accounting.quickbooks.clientId?.trim() || undefined,
                clientSecret:
                  data.accounting.quickbooks.clientSecret === null
                    ? null
                    : data.accounting.quickbooks.clientSecret?.trim() || undefined,
              })
            : undefined,
        }
      : undefined,
    crm: data.crm
      ? {
          hubspot: data.crm.hubspot
            ? sanitizePayload({
                enabled: data.crm.hubspot.enabled,
                apiKey:
                  data.crm.hubspot.apiKey === null
                    ? null
                    : data.crm.hubspot.apiKey?.trim() || undefined,
              })
            : undefined,
        }
      : undefined,
    webhooks: data.webhooks
      ? sanitizePayload({
          enabled: data.webhooks.enabled,
          url: data.webhooks.url?.trim() || undefined,
          secret:
            data.webhooks.secret === null
              ? null
              : data.webhooks.secret?.trim() || undefined,
        })
      : undefined,
  };

  return sanitizePayload(payload);
};

const prepareCompliancePayload = (data: UpdateComplianceSettingsRequest) => {
  if (!data) return undefined;
  const payload: UpdateComplianceSettingsRequest = {
    requireTwoFactor: data.requireTwoFactor,
    sessionTimeoutMinutes: data.sessionTimeoutMinutes,
    dataRetentionDays: data.dataRetentionDays,
    allowDataExport: data.allowDataExport,
    autoPurgeAuditLogs: data.autoPurgeAuditLogs,
    auditNotificationEmails: data.auditNotificationEmails
      ? data.auditNotificationEmails
          .map((email) => email?.trim())
          .filter((email): email is string => Boolean(email))
      : undefined,
  };

  return sanitizePayload(payload);
};

export const settingsService = {
  async getStores(): Promise<StoreSettings[]> {
    const response = await api.get<{ data: { stores: StoreSettings[] } } | { data: StoreSettings[] }>('/stores');
    // Handle both response formats: { data: { stores: [] } } or { data: [] }
    const stores = (response.data as any).stores || (response.data as any);
    return (Array.isArray(stores) ? stores : []).map(mapStoreResponse);
  },

  async getStore(id: string): Promise<StoreSettings> {
    const response = await api.get<{ data: StoreSettings }>(`/stores/${id}`);
    return mapStoreResponse(response.data.data);
  },

  async createStore(data: CreateStoreRequest): Promise<StoreSettings> {
    const payload = prepareStorePayload(data);
    const response = await api.post<{ data: StoreSettings }>('/stores', payload);
    return mapStoreResponse(response.data.data);
  },

  async updateStore(id: string, data: UpdateStoreRequest): Promise<StoreSettings> {
    const payload = prepareStorePayload(data);
    const response = await api.put<{ data: StoreSettings }>(`/stores/${id}`, payload);
    return mapStoreResponse(response.data.data);
  },

  async deleteStore(id: string): Promise<void> {
    await api.delete(`/stores/${id}`);
  },

  async getBusinessSettings(): Promise<BusinessSettings> {
    const response = await api.get<{
      success: boolean;
      data: BusinessSettings;
      message: string;
    }>('/settings/business');
    return response.data.data;
  },

  async updateBusinessSettings(
    data: Partial<BusinessSettings>
  ): Promise<BusinessSettings> {
    const response = await api.put<{
      success: boolean;
      data: BusinessSettings;
      message: string;
    }>('/settings/business', data);
    return response.data.data;
  },

  async getTaxSettings(): Promise<TaxSettings> {
    const response = await api.get<{
      success: boolean;
      data: TaxSettings;
      message: string;
    }>('/settings/tax');
    return {
      ...taxDefaults,
      ...response.data.data,
    };
  },

  async updateTaxSettings(data: Partial<TaxSettings>): Promise<TaxSettings> {
    const response = await api.put<{
      success: boolean;
      data: TaxSettings;
      message: string;
    }>('/settings/tax', data);
    return {
      ...taxDefaults,
      ...response.data.data,
    };
  },

  async getReceiptSettings(): Promise<ReceiptSettings> {
    const response = await api.get<{
      success: boolean;
      data: ReceiptSettings;
      message: string;
    }>('/settings/receipt');
    return mergeReceiptSettings(response.data.data);
  },

  async updateReceiptSettings(data: ReceiptSettings): Promise<ReceiptSettings> {
    const response = await api.put<{
      success: boolean;
      data: ReceiptSettings;
      message: string;
    }>('/settings/receipt', data);
    return mergeReceiptSettings(response.data.data);
  },

  async getPOSSettings(): Promise<POSSettings> {
    const response = await api.get<{
      success: boolean;
      data: POSSettings;
      message: string;
    }>('/settings/pos');
    return mergePosSettings(response.data.data);
  },

  async updatePOSSettings(data: POSSettings): Promise<POSSettings> {
    const response = await api.put<{
      success: boolean;
      data: POSSettings;
      message: string;
    }>('/settings/pos', data);
    return mergePosSettings(response.data.data);
  },

  async getPaymentSettings(): Promise<PaymentSettings> {
    const response = await api.get<{
      success: boolean;
      data: PaymentSettings;
      message: string;
    }>('/settings/payments');
    return {
      ...paymentSettingsDefaults,
      ...response.data.data,
    };
  },

  async updatePaymentSettings(
    data: UpdatePaymentSettingsRequest
  ): Promise<PaymentSettings> {
    const payload = preparePaymentPayload(data);
    const response = await api.put<{
      success: boolean;
      data: PaymentSettings;
      message: string;
    }>('/settings/payments', payload);
    return response.data.data;
  },

  async testStripeConnection() {
    const response = await api.post<{
      success: boolean;
      data: { connected: boolean };
      message: string;
    }>(
      '/payments/test-stripe'
    );
    return response.data.data;
  },

  async getIntegrationSettings(): Promise<IntegrationSettings> {
    const response = await api.get<{
      success: boolean;
      data: IntegrationSettings;
      message: string;
    }>('/settings/integrations');
    return response.data.data;
  },

  async updateIntegrationSettings(
    data: UpdateIntegrationSettingsRequest
  ): Promise<IntegrationSettings> {
    const payload = prepareIntegrationPayload(data);
    const response = await api.put<{
      success: boolean;
      data: IntegrationSettings;
      message: string;
    }>(
      '/settings/integrations',
      payload
    );
    return response.data.data;
  },

  async getComplianceSettings(): Promise<ComplianceSettings> {
    const response = await api.get<{
      success: boolean;
      data: ComplianceSettings;
      message: string;
    }>('/settings/compliance');
    return response.data.data;
  },

  async updateComplianceSettings(
    data: UpdateComplianceSettingsRequest
  ): Promise<ComplianceSettings> {
    const payload = prepareCompliancePayload(data);
    const response = await api.put<{
      success: boolean;
      data: ComplianceSettings;
      message: string;
    }>(
      '/settings/compliance',
      payload
    );
    return response.data.data;
  },

  async getCommunicationSettings(): Promise<CommunicationSettings> {
    const response = await api.get<{
      success: boolean;
      data: CommunicationSettings;
      message: string;
    }>('/settings/communications');
    return response.data.data;
  },

  async updateCommunicationSettings(
    data: UpdateCommunicationSettingsRequest
  ): Promise<CommunicationSettings> {
    const response = await api.put<{
      success: boolean;
      data: CommunicationSettings;
      message: string;
    }>(
      '/settings/communications',
      data
    );
    return response.data.data;
  },
};
