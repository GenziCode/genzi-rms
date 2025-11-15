import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Store,
  Settings,
  Receipt,
  DollarSign,
  ShoppingCart,
  Save,
  Loader2,
  Mail,
  CreditCard,
  Plug,
  Shield,
} from 'lucide-react';
import { settingsService } from '@/services/settings.service';
import ReceiptDesigner from '@/components/settings/ReceiptDesigner';
import { useStore } from '@/contexts/StoreContext';
import type {
  TaxSettings,
  ReceiptSettings,
  POSSettings,
  BusinessSettings,
  UpdateStoreRequest,
  StoreSettings,
  PaymentSettings,
  IntegrationSettings,
  ComplianceSettings,
  UpdatePaymentSettingsRequest,
  UpdateIntegrationSettingsRequest,
  UpdateComplianceSettingsRequest,
  CreateStoreRequest,
} from '@/types/settings.types';
import CommunicationSettingsForm from '@/components/settings/CommunicationSettingsForm';
import { toast } from 'sonner';

const PLACEHOLDER_STORE_ID = '000000000000000000000001';

const initialCreateStoreForm: CreateStoreRequest = {
  name: '',
  code: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  },
  phone: '',
  email: '',
  contact: {
    phone: '',
    email: '',
    website: '',
  },
  businessDetails: {
    registrationNumber: '',
    taxId: '',
    businessType: '',
  },
  settings: {
    timezone: 'America/New_York',
    currency: 'USD',
  },
  timezone: 'America/New_York',
  currency: 'USD',
  isActive: true,
  isDefault: true,
};

const cloneInitialCreateStoreForm = () =>
  JSON.parse(JSON.stringify(initialCreateStoreForm)) as CreateStoreRequest;

interface PaymentFormState {
  allowCash: boolean;
  allowCard: boolean;
  allowBankTransfer: boolean;
  allowStoreCredit: boolean;
  requireSignature: boolean;
  autoCapture: boolean;
  stripe: {
    enabled: boolean;
    publishableKey: string;
    secretKeyInput: string;
    secretKeySet: boolean;
    clearSecret: boolean;
    webhookSecretInput: string;
    webhookSecretSet: boolean;
    clearWebhook: boolean;
    lastTestedAt?: string;
    lastTestResult?: 'success' | 'failure';
  };
}

interface IntegrationFormState {
  ecommerce: {
    shopifyEnabled: boolean;
    storeDomain: string;
    accessTokenInput: string;
    accessTokenSet: boolean;
    clearAccessToken: boolean;
  };
  accounting: {
    quickbooksEnabled: boolean;
    realmId: string;
    clientId: string;
    clientSecretInput: string;
    clientSecretSet: boolean;
    clearClientSecret: boolean;
  };
  crm: {
    hubspotEnabled: boolean;
    apiKeyInput: string;
    apiKeySet: boolean;
    clearApiKey: boolean;
  };
  webhooks: {
    enabled: boolean;
    url: string;
    secretInput: string;
    secretSet: boolean;
    clearSecret: boolean;
    lastTestedAt?: string;
    lastTestResult?: 'success' | 'failure';
  };
}

interface ComplianceFormState extends ComplianceSettings {
  auditEmailsText: string;
}

const cloneForCompare = <T extends Record<string, any>>(value: T | null) =>
  JSON.parse(JSON.stringify(value ?? {})) as T;

const pruneEmptyStrings = (value: any) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  Object.keys(value).forEach((key) => {
    const current = value[key];

    if (typeof current === 'string') {
      const trimmed = current.trim();
      if (trimmed.length === 0) {
        delete value[key];
      } else {
        value[key] = trimmed;
      }
      return;
    }

    if (current === null || current === undefined) {
      delete value[key];
      return;
    }

    if (typeof current === 'object') {
      pruneEmptyStrings(current);
      if (!Array.isArray(current) && Object.keys(current).length === 0) {
        delete value[key];
      }
    }
  });

  return value;
};

const prepareStoreForm = (store: StoreSettings): UpdateStoreRequest => ({
  name: store.name ?? '',
  code: store.code ?? '',
  address: {
    street: store.address?.street ?? '',
    city: store.address?.city ?? '',
    state: store.address?.state ?? '',
    zipCode: store.address?.zipCode ?? '',
    country: store.address?.country ?? '',
  },
  phone: store.phone ?? store.contact?.phone ?? '',
  email: store.email ?? store.contact?.email ?? '',
  contact: {
    phone: store.contact?.phone ?? store.phone ?? '',
    email: store.contact?.email ?? store.email ?? '',
    website: store.contact?.website ?? '',
  },
  businessDetails: {
    registrationNumber: store.businessDetails?.registrationNumber ?? '',
    taxId: store.businessDetails?.taxId ?? '',
    businessType: store.businessDetails?.businessType ?? '',
  },
  settings: {
    ...store.settings,
    timezone: store.timezone ?? store.settings?.timezone ?? 'America/New_York',
    currency: store.currency ?? store.settings?.currency ?? 'USD',
  },
  timezone: store.timezone ?? store.settings?.timezone ?? 'America/New_York',
  currency: store.currency ?? store.settings?.currency ?? 'USD',
  isActive: store.isActive,
  isDefault: store.isDefault,
});

const prepareStoreSubmission = (
  form: UpdateStoreRequest
): UpdateStoreRequest => {
  const cloned = cloneForCompare(form);
  const cleaned = pruneEmptyStrings(cloned) as UpdateStoreRequest;

  if (cleaned.contact?.phone && !cleaned.phone) {
    cleaned.phone = cleaned.contact.phone;
  }
  if (cleaned.contact?.email && !cleaned.email) {
    cleaned.email = cleaned.contact.email;
  }

  return cleaned;
};

const prepareCreateStoreSubmission = (
  form: CreateStoreRequest
): CreateStoreRequest => {
  const cloned = JSON.parse(JSON.stringify(form)) as CreateStoreRequest;
  const cleaned = pruneEmptyStrings(cloned) as CreateStoreRequest;

  if (cleaned.contact?.phone && !cleaned.phone) {
    cleaned.phone = cleaned.contact.phone;
  }
  if (cleaned.contact?.email && !cleaned.email) {
    cleaned.email = cleaned.contact.email;
  }

  return cleaned;
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<
    | 'store'
    | 'business'
    | 'tax'
    | 'receipt'
    | 'pos'
    | 'communications'
    | 'payments'
    | 'integrations'
    | 'compliance'
  >('store');
  const { currentStore: contextStore, setCurrentStore } = useStore();
  const selectedStoreId = contextStore?._id ?? null;
  const queryClient = useQueryClient();

  const { data: storeList, isLoading: storesLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: settingsService.getStores,
  });

  const activeStore = useMemo(() => {
    if (!storeList?.length) {
      return null;
    }

    if (selectedStoreId && selectedStoreId !== PLACEHOLDER_STORE_ID) {
      return (
        storeList.find((store) => store._id === selectedStoreId) ?? storeList[0]
      );
    }

    return storeList[0];
  }, [storeList, selectedStoreId]);

  const hasStores = (storeList?.length ?? 0) > 0;
  const activeStoreId = activeStore?._id ?? null;
  const isPlaceholderStore = !activeStoreId;

  const { data: businessSettings, isLoading: businessLoading } = useQuery({
    queryKey: ['businessSettings'],
    queryFn: () => settingsService.getBusinessSettings(),
  });

  // Fetch tax settings
  const { data: taxSettings, isLoading: taxLoading } = useQuery({
    queryKey: ['taxSettings'],
    queryFn: () => settingsService.getTaxSettings(),
  });

  // Fetch receipt settings
  const { data: receiptSettings, isLoading: receiptLoading } = useQuery({
    queryKey: ['receiptSettings'],
    queryFn: () => settingsService.getReceiptSettings(),
  });

  // Fetch POS settings
  const { data: posSettings, isLoading: posLoading } = useQuery({
    queryKey: ['posSettings'],
    queryFn: () => settingsService.getPOSSettings(),
  });

  const { data: paymentSettings, isLoading: paymentsLoading } =
    useQuery<PaymentSettings>({
      queryKey: ['paymentSettings'],
      queryFn: () => settingsService.getPaymentSettings(),
    });

  const { data: integrationSettings, isLoading: integrationsLoading } =
    useQuery<IntegrationSettings>({
      queryKey: ['integrationSettings'],
      queryFn: () => settingsService.getIntegrationSettings(),
    });

  const { data: complianceSettings, isLoading: complianceLoading } =
    useQuery<ComplianceSettings>({
      queryKey: ['complianceSettings'],
      queryFn: () => settingsService.getComplianceSettings(),
    });

  // Store form state
  const [businessForm, setBusinessForm] = useState<BusinessSettings | null>(
    null
  );
  const [storeForm, setStoreForm] = useState<UpdateStoreRequest>({});
  const [storeBaseline, setStoreBaseline] = useState<UpdateStoreRequest | null>(
    null
  );
  const [taxForm, setTaxForm] = useState<TaxSettings | null>(null);
  const [receiptForm, setReceiptForm] = useState<ReceiptSettings | null>(null);
  const handleReceiptChange = (settings: ReceiptSettings) => {
    setReceiptForm(settings);
  };
  const [posForm, setPosForm] = useState<POSSettings | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState | null>(null);
  const [integrationForm, setIntegrationForm] =
    useState<IntegrationFormState | null>(null);
  const [complianceForm, setComplianceForm] =
    useState<ComplianceFormState | null>(null);
  const [paymentDirty, setPaymentDirty] = useState(false);
  const [integrationDirty, setIntegrationDirty] = useState(false);
  const [complianceDirty, setComplianceDirty] = useState(false);
  const [stripeTesting, setStripeTesting] = useState(false);
  const [createStoreForm, setCreateStoreForm] = useState<CreateStoreRequest>(
    cloneInitialCreateStoreForm()
  );
  const [createStoreBaseline, setCreateStoreBaseline] =
    useState<CreateStoreRequest>(cloneInitialCreateStoreForm());

  useEffect(() => {
    if (businessSettings) {
      setBusinessForm(businessSettings);
    }
  }, [businessSettings]);

  useEffect(() => {
    if (!activeStore) {
      return;
    }

    const nextForm = prepareStoreForm(activeStore);
    setStoreForm(nextForm);
    setStoreBaseline(nextForm);
  }, [activeStore]);

  useEffect(() => {
    if (taxSettings) setTaxForm(taxSettings);
  }, [taxSettings]);

  useEffect(() => {
    if (receiptSettings) setReceiptForm(receiptSettings);
  }, [receiptSettings]);

  useEffect(() => {
    if (posSettings) setPosForm(posSettings);
  }, [posSettings]);

  useEffect(() => {
    if (paymentSettings) {
      setPaymentForm({
        allowCash: paymentSettings.allowCash,
        allowCard: paymentSettings.allowCard,
        allowBankTransfer: paymentSettings.allowBankTransfer,
        allowStoreCredit: paymentSettings.allowStoreCredit,
        requireSignature: paymentSettings.requireSignature,
        autoCapture: paymentSettings.autoCapture,
        stripe: {
          enabled: paymentSettings.stripe.enabled,
          publishableKey: paymentSettings.stripe.publishableKey,
          secretKeyInput: '',
          secretKeySet: paymentSettings.stripe.secretKeySet,
          clearSecret: false,
          webhookSecretInput: '',
          webhookSecretSet: paymentSettings.stripe.webhookSecretSet,
          clearWebhook: false,
          lastTestedAt: paymentSettings.stripe.lastTestedAt,
          lastTestResult: paymentSettings.stripe.lastTestResult,
        },
      });
      setPaymentDirty(false);
    }
  }, [paymentSettings]);

  useEffect(() => {
    if (integrationSettings) {
      setIntegrationForm({
        ecommerce: {
          shopifyEnabled: integrationSettings.ecommerce.shopify.enabled,
          storeDomain: integrationSettings.ecommerce.shopify.storeDomain || '',
          accessTokenInput: '',
          accessTokenSet: integrationSettings.ecommerce.shopify.accessTokenSet,
          clearAccessToken: false,
        },
        accounting: {
          quickbooksEnabled: integrationSettings.accounting.quickbooks.enabled,
          realmId: integrationSettings.accounting.quickbooks.realmId || '',
          clientId: integrationSettings.accounting.quickbooks.clientId || '',
          clientSecretInput: '',
          clientSecretSet:
            integrationSettings.accounting.quickbooks.clientSecretSet,
          clearClientSecret: false,
        },
        crm: {
          hubspotEnabled: integrationSettings.crm.hubspot.enabled,
          apiKeyInput: '',
          apiKeySet: integrationSettings.crm.hubspot.apiKeySet,
          clearApiKey: false,
        },
        webhooks: {
          enabled: integrationSettings.webhooks.enabled,
          url: integrationSettings.webhooks.url || '',
          secretInput: '',
          secretSet: integrationSettings.webhooks.secretSet,
          clearSecret: false,
          lastTestedAt: integrationSettings.webhooks.lastTestedAt,
          lastTestResult: integrationSettings.webhooks.lastTestResult,
        },
      });
      setIntegrationDirty(false);
    }
  }, [integrationSettings]);

  useEffect(() => {
    if (complianceSettings) {
      setComplianceForm({
        ...complianceSettings,
        auditEmailsText: complianceSettings.auditNotificationEmails.join(', '),
      });
      setComplianceDirty(false);
    }
  }, [complianceSettings]);

  // Update business settings
  const updateBusinessMutation = useMutation({
    mutationFn: (data: BusinessSettings) =>
      settingsService.updateBusinessSettings(data),
    onSuccess: (updated) => {
      setBusinessForm(updated);
      queryClient.invalidateQueries({ queryKey: ['businessSettings'] });
      toast.success('Business settings saved successfully!');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to save business settings'
      );
    },
  });

  // Update store mutation
  const updateStoreMutation = useMutation({
    mutationFn: async (data: UpdateStoreRequest) => {
      if (!activeStoreId) {
        throw new Error('Select a store before saving settings.');
      }

      const payload = prepareStoreSubmission(data);
      return settingsService.updateStore(activeStoreId, payload);
    },
    onSuccess: (updatedStore) => {
      const nextForm = prepareStoreForm(updatedStore);
      setStoreForm(nextForm);
      setStoreBaseline(nextForm);
      setCurrentStore({
        _id: updatedStore._id,
        name: updatedStore.name,
        code: updatedStore.code,
        isDefault: updatedStore.isDefault,
      });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast.success('Store settings saved successfully!');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to save store settings';
      toast.error(message);
    },
  });

  // Update tax mutation
  const updateTaxMutation = useMutation({
    mutationFn: (data: TaxSettings) => settingsService.updateTaxSettings(data),
    onSuccess: (updated) => {
      setTaxForm(updated);
      queryClient.invalidateQueries({ queryKey: ['taxSettings'] });
      toast.success('Tax settings saved successfully!');
    },
  });

  // Update receipt mutation
  const updateReceiptMutation = useMutation({
    mutationFn: (data: ReceiptSettings) =>
      settingsService.updateReceiptSettings(data),
    onSuccess: (updated) => {
      setReceiptForm(updated);
      queryClient.invalidateQueries({ queryKey: ['receiptSettings'] });
      toast.success('Receipt settings saved successfully!');
    },
  });

  // Update POS mutation
  const updatePOSMutation = useMutation({
    mutationFn: (data: POSSettings) => settingsService.updatePOSSettings(data),
    onSuccess: (updated) => {
      setPosForm(updated);
      queryClient.invalidateQueries({ queryKey: ['posSettings'] });
      toast.success('POS settings saved successfully!');
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: (payload: UpdatePaymentSettingsRequest) =>
      settingsService.updatePaymentSettings(payload),
    onSuccess: (updated) => {
      setPaymentForm((prev) => ({
        allowCash: updated.allowCash,
        allowCard: updated.allowCard,
        allowBankTransfer: updated.allowBankTransfer,
        allowStoreCredit: updated.allowStoreCredit,
        requireSignature: updated.requireSignature,
        autoCapture: updated.autoCapture,
        stripe: {
          enabled: updated.stripe.enabled,
          publishableKey: updated.stripe.publishableKey,
          secretKeyInput: '',
          secretKeySet: updated.stripe.secretKeySet,
          clearSecret: false,
          webhookSecretInput: '',
          webhookSecretSet: updated.stripe.webhookSecretSet,
          clearWebhook: false,
          lastTestedAt: updated.stripe.lastTestedAt,
          lastTestResult: updated.stripe.lastTestResult,
        },
      }));
      setPaymentDirty(false);
      queryClient.invalidateQueries({ queryKey: ['paymentSettings'] });
      toast.success('Payment settings saved successfully!');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to save payment settings'
      );
    },
  });

  const updateIntegrationMutation = useMutation({
    mutationFn: (payload: UpdateIntegrationSettingsRequest) =>
      settingsService.updateIntegrationSettings(payload),
    onSuccess: (updated) => {
      setIntegrationForm({
        ecommerce: {
          shopifyEnabled: updated.ecommerce.shopify.enabled,
          storeDomain: updated.ecommerce.shopify.storeDomain || '',
          accessTokenInput: '',
          accessTokenSet: updated.ecommerce.shopify.accessTokenSet,
          clearAccessToken: false,
        },
        accounting: {
          quickbooksEnabled: updated.accounting.quickbooks.enabled,
          realmId: updated.accounting.quickbooks.realmId || '',
          clientId: updated.accounting.quickbooks.clientId || '',
          clientSecretInput: '',
          clientSecretSet: updated.accounting.quickbooks.clientSecretSet,
          clearClientSecret: false,
        },
        crm: {
          hubspotEnabled: updated.crm.hubspot.enabled,
          apiKeyInput: '',
          apiKeySet: updated.crm.hubspot.apiKeySet,
          clearApiKey: false,
        },
        webhooks: {
          enabled: updated.webhooks.enabled,
          url: updated.webhooks.url || '',
          secretInput: '',
          secretSet: updated.webhooks.secretSet,
          clearSecret: false,
          lastTestedAt: updated.webhooks.lastTestedAt,
          lastTestResult: updated.webhooks.lastTestResult,
        },
      });
      setIntegrationDirty(false);
      queryClient.invalidateQueries({ queryKey: ['integrationSettings'] });
      toast.success('Integration settings saved successfully!');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to save integration settings'
      );
    },
  });

  const updateComplianceMutation = useMutation({
    mutationFn: (payload: UpdateComplianceSettingsRequest) =>
      settingsService.updateComplianceSettings(payload),
    onSuccess: (updated) => {
      setComplianceForm({
        ...updated,
        auditEmailsText: updated.auditNotificationEmails.join(', '),
      });
      setComplianceDirty(false);
      queryClient.invalidateQueries({ queryKey: ['complianceSettings'] });
      toast.success('Compliance settings saved successfully!');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to save compliance settings'
      );
    },
  });

  const createStoreMutation = useMutation({
    mutationFn: async (data: CreateStoreRequest) => {
      const payload = prepareCreateStoreSubmission(data);
      return settingsService.createStore(payload);
    },
    onSuccess: (createdStore) => {
      const baseline = prepareStoreForm(createdStore);
      setStoreForm(baseline);
      setStoreBaseline(baseline);
      setCreateStoreForm(cloneInitialCreateStoreForm());
      setCreateStoreBaseline(cloneInitialCreateStoreForm());
      setCurrentStore({
        _id: createdStore._id,
        name: createdStore.name,
        code: createdStore.code,
        isDefault: createdStore.isDefault,
      });
    queryClient.setQueryData<StoreSettings[] | undefined>(
      ['stores'],
      (existing) => {
        if (!existing || existing.length === 0) {
          return [createdStore];
        }
        const found = existing.some(
          (store) => store._id === createdStore._id
        );
        if (found) {
          return existing.map((store) =>
            store._id === createdStore._id ? createdStore : store
          );
        }
        return [...existing, createdStore];
      }
    );
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast.success('Store created successfully!');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create store';
      toast.error(message);
    },
  });

  const tabs = [
    { id: 'store', label: 'Store', icon: Store },
    { id: 'business', label: 'Business', icon: Settings },
    { id: 'tax', label: 'Tax', icon: DollarSign },
    { id: 'receipt', label: 'Receipt', icon: Receipt },
    { id: 'pos', label: 'POS', icon: ShoppingCart },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'compliance', label: 'Compliance', icon: Shield },
    { id: 'communications', label: 'Communications', icon: Mail },
  ];

  const currencyOptions = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'PKR', label: 'PKR - Pakistani Rupee' },
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'AED', label: 'AED - UAE Dirham' },
  ];

  const timezoneOptions = [
    { value: 'America/New_York', label: 'America/New_York (EST)' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
    { value: 'Europe/London', label: 'Europe/London (GMT)' },
    { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
    { value: 'Asia/Karachi', label: 'Asia/Karachi (PKT)' },
    { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
  ];

  const dateFormatOptions = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  ];

  const timeFormatOptions = [
    { value: '12h', label: '12 hour' },
    { value: '24h', label: '24 hour' },
  ];

  const isLoading =
    storesLoading ||
    businessLoading ||
    taxLoading ||
    receiptLoading ||
    posLoading ||
    paymentsLoading ||
    integrationsLoading ||
    complianceLoading;

  const buildPaymentPayload = (): UpdatePaymentSettingsRequest | undefined => {
    if (!paymentForm) return undefined;
    return {
      allowCash: paymentForm.allowCash,
      allowCard: paymentForm.allowCard,
      allowBankTransfer: paymentForm.allowBankTransfer,
      allowStoreCredit: paymentForm.allowStoreCredit,
      requireSignature: paymentForm.requireSignature,
      autoCapture: paymentForm.autoCapture,
      stripe: {
        enabled: paymentForm.stripe.enabled,
        publishableKey: paymentForm.stripe.publishableKey,
        secretKey: paymentForm.stripe.clearSecret
          ? null
          : paymentForm.stripe.secretKeyInput.trim().length > 0
            ? paymentForm.stripe.secretKeyInput
            : undefined,
        webhookSecret: paymentForm.stripe.clearWebhook
          ? null
          : paymentForm.stripe.webhookSecretInput.trim().length > 0
            ? paymentForm.stripe.webhookSecretInput
            : undefined,
      },
    };
  };

  const buildIntegrationPayload = ():
    | UpdateIntegrationSettingsRequest
    | undefined => {
    if (!integrationForm) return undefined;
    return {
      ecommerce: {
        shopify: {
          enabled: integrationForm.ecommerce.shopifyEnabled,
          storeDomain: integrationForm.ecommerce.storeDomain,
          accessToken: integrationForm.ecommerce.clearAccessToken
            ? null
            : integrationForm.ecommerce.accessTokenInput.trim().length > 0
              ? integrationForm.ecommerce.accessTokenInput
              : undefined,
        },
      },
      accounting: {
        quickbooks: {
          enabled: integrationForm.accounting.quickbooksEnabled,
          realmId: integrationForm.accounting.realmId,
          clientId: integrationForm.accounting.clientId,
          clientSecret: integrationForm.accounting.clearClientSecret
            ? null
            : integrationForm.accounting.clientSecretInput.trim().length > 0
              ? integrationForm.accounting.clientSecretInput
              : undefined,
        },
      },
      crm: {
        hubspot: {
          enabled: integrationForm.crm.hubspotEnabled,
          apiKey: integrationForm.crm.clearApiKey
            ? null
            : integrationForm.crm.apiKeyInput.trim().length > 0
              ? integrationForm.crm.apiKeyInput
              : undefined,
        },
      },
      webhooks: {
        enabled: integrationForm.webhooks.enabled,
        url: integrationForm.webhooks.url,
        secret: integrationForm.webhooks.clearSecret
          ? null
          : integrationForm.webhooks.secretInput.trim().length > 0
            ? integrationForm.webhooks.secretInput
            : undefined,
      },
    };
  };

  const buildCompliancePayload = ():
    | UpdateComplianceSettingsRequest
    | undefined => {
    if (!complianceForm) return undefined;
    return {
      requireTwoFactor: complianceForm.requireTwoFactor,
      sessionTimeoutMinutes: complianceForm.sessionTimeoutMinutes,
      dataRetentionDays: complianceForm.dataRetentionDays,
      allowDataExport: complianceForm.allowDataExport,
      autoPurgeAuditLogs: complianceForm.autoPurgeAuditLogs,
      auditNotificationEmails: complianceForm.auditNotificationEmails,
    };
  };

  const stripeTestStatus =
    paymentForm?.stripe.lastTestResult && paymentForm.stripe.lastTestedAt
      ? `${paymentForm.stripe.lastTestResult === 'success' ? 'Success' : 'Failure'} · ${new Date(
          paymentForm.stripe.lastTestedAt
        ).toLocaleString()}`
      : 'Never tested';

  const webhookTestStatus =
    integrationForm?.webhooks.lastTestResult &&
    integrationForm.webhooks.lastTestedAt
      ? `${integrationForm.webhooks.lastTestResult === 'success' ? 'Success' : 'Failure'} · ${new Date(
          integrationForm.webhooks.lastTestedAt
        ).toLocaleString()}`
      : 'Never tested';

  const isStripeReady =
    !!paymentForm &&
    paymentForm.stripe.enabled &&
    paymentForm.stripe.publishableKey.trim().length > 0 &&
    (paymentForm.stripe.secretKeyInput.trim().length > 0 ||
      paymentForm.stripe.secretKeySet) &&
    (paymentForm.stripe.webhookSecretInput.trim().length > 0 ||
      paymentForm.stripe.webhookSecretSet);

  const handleStripeTest = async () => {
    if (!isStripeReady) {
      toast.warning(
        'Complete Stripe credentials before testing the connection.'
      );
      return;
    }
    try {
      setStripeTesting(true);
      const result = await settingsService.testStripeConnection();
      toast[result.connected ? 'success' : 'error'](
        result.connected
          ? 'Stripe connection successful!'
          : 'Stripe connection failed. Check your credentials.'
      );
      queryClient.invalidateQueries({ queryKey: ['paymentSettings'] });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to test Stripe connection'
      );
    } finally {
      setStripeTesting(false);
    }
  };

  const handleComplianceEmailsChange = (value: string) => {
    setComplianceForm((prev) => {
      if (!prev) return prev;
      const emails = value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      return {
        ...prev,
        auditEmailsText: value,
        auditNotificationEmails: emails,
      };
    });
    setComplianceDirty(true);
  };

  useEffect(() => {
    if (!storeList?.length) {
      return;
    }

    if (!selectedStoreId || selectedStoreId === PLACEHOLDER_STORE_ID) {
      const preferred =
        storeList.find((store) => store.isDefault) ?? storeList[0];
      setCurrentStore({
        _id: preferred._id,
        name: preferred.name,
        code: preferred.code,
        isDefault: preferred.isDefault,
      });
      return;
    }

    const exists = storeList.some((store) => store._id === selectedStoreId);
    if (!exists) {
      const fallback =
        storeList.find((store) => store.isDefault) ?? storeList[0];
      setCurrentStore({
        _id: fallback._id,
        name: fallback.name,
        code: fallback.code,
        isDefault: fallback.isDefault,
      });
    }
  }, [storeList, selectedStoreId, setCurrentStore]);

  const storeErrors = useMemo(() => {
    if (!storeBaseline) {
      return [];
    }

    const errors: string[] = [];

    if (!storeForm.name?.trim()) {
      errors.push('Store name is required.');
    }
    if (!storeForm.code?.trim()) {
      errors.push('Store code is required.');
    }
    if (!storeForm.phone?.trim()) {
      errors.push('Primary phone number is required.');
    }
    if (!storeForm.email?.trim()) {
      errors.push('Primary email address is required.');
    }

    const address = storeForm.address ?? {};
    if (!address.street?.trim()) {
      errors.push('Street address is required.');
    }
    if (!address.city?.trim()) {
      errors.push('City is required.');
    }
    if (!address.country?.trim()) {
      errors.push('Country is required.');
    }

    if (!storeForm.currency?.trim()) {
      errors.push('Store currency is required.');
    }
    if (!storeForm.timezone?.trim()) {
      errors.push('Store timezone is required.');
    }

    return errors;
  }, [storeBaseline, storeForm]);

  const isStoreDirty = useMemo(() => {
    if (!storeBaseline) {
      return false;
    }
    return (
      JSON.stringify(cloneForCompare(storeBaseline)) !==
      JSON.stringify(cloneForCompare(storeForm))
    );
  }, [storeBaseline, storeForm]);

  const isStoreValid = storeErrors.length === 0;
  const disableDefaultToggle = (storeList?.length ?? 0) <= 1;

  const isStoreSaveDisabled =
    updateStoreMutation.isPending ||
    !activeStoreId ||
    !isStoreDirty ||
    !isStoreValid;

  useEffect(() => {
    if (!hasStores) {
      const fresh = cloneInitialCreateStoreForm();
      setCreateStoreForm(fresh);
      setCreateStoreBaseline(cloneInitialCreateStoreForm());
      setStoreForm({});
      setStoreBaseline(null);
      return;
    }
  }, [hasStores]);

  const createStoreErrors = useMemo(() => {
    const errors: string[] = [];

    if (!createStoreForm.name?.trim()) {
      errors.push('Store name is required.');
    }
    if (!createStoreForm.code?.trim()) {
      errors.push('Store code is required.');
    }
    if (
      !createStoreForm.phone?.trim() &&
      !createStoreForm.contact?.phone?.trim()
    ) {
      errors.push('Primary phone number is required.');
    }
    if (
      !createStoreForm.email?.trim() &&
      !createStoreForm.contact?.email?.trim()
    ) {
      errors.push('Primary email address is required.');
    }

    const address = createStoreForm.address ?? {};
    if (!address.street?.trim()) {
      errors.push('Street address is required.');
    }
    if (!address.city?.trim()) {
      errors.push('City is required.');
    }
    if (!address.country?.trim()) {
      errors.push('Country is required.');
    }

    if (!createStoreForm.currency?.trim()) {
      errors.push('Store currency is required.');
    }
    if (!createStoreForm.timezone?.trim()) {
      errors.push('Store timezone is required.');
    }

    return errors;
  }, [createStoreForm]);

  const isCreateStoreValid = createStoreErrors.length === 0;
  const isCreateStoreDirty = useMemo(() => {
    return (
      JSON.stringify(cloneForCompare(createStoreBaseline)) !==
      JSON.stringify(cloneForCompare(createStoreForm))
    );
  }, [createStoreBaseline, createStoreForm]);

  const isCreateStoreSaveDisabled =
    createStoreMutation.isPending || !isCreateStoreDirty || !isCreateStoreValid;

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-4 sm:px-6 lg:px-10 space-y-6">
      <div className="space-y-1 sm:space-y-2">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Control Center
        </p>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Settings
        </h1>
        <p className="text-sm text-slate-600">
          Configure stores, payments, compliance, and more. Optimized for mobile operators.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100">
          <nav className="flex flex-wrap gap-2 px-3 py-2 text-sm sm:gap-3 sm:px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 font-medium transition sm:flex-none sm:px-4 sm:py-3 ${
                    activeTab === tab.id
                      ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="px-3 py-4 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* Store Settings */}
              {activeTab === 'store' && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Store Settings
                      </h3>
                      <p className="text-sm text-gray-600">
                        Configure your store identity, contact details, and
                        operational defaults.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        htmlFor="store-selector"
                        className="text-sm font-medium text-gray-700"
                      >
                        Active store
                      </label>
                      <select
                        id="store-selector"
                        value={activeStoreId ?? ''}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (!value) return;
                          const nextStore = storeList?.find(
                            (store) => store._id === value
                          );
                          if (nextStore) {
                            setCurrentStore({
                              _id: nextStore._id,
                              name: nextStore.name,
                              code: nextStore.code,
                              isDefault: nextStore.isDefault,
                            });
                          }
                        }}
                        disabled={storesLoading || !hasStores}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {!hasStores && (
                          <option value="">No stores available</option>
                        )}
                        {hasStores && !activeStoreId && (
                          <option value="">Select a store</option>
                        )}
                        {storeList?.map((store) => (
                          <option key={store._id} value={store._id}>
                            {store.name}
                            {store.isDefault ? ' (Default)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {hasStores && storeList?.length ? (
                    <section className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            Active stores
                          </p>
                          <p className="text-xs text-slate-500">
                            Tap a card to switch context or review status.
                          </p>
                        </div>
                        <span className="text-xs font-medium text-slate-500">
                          {storeList.length} total
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {storeList.map((store) => {
                          const isSelected = store._id === activeStoreId;
                          return (
                            <button
                              key={store._id}
                              type="button"
                              onClick={() =>
                                setCurrentStore({
                                  _id: store._id,
                                  name: store.name,
                                  code: store.code,
                                  isDefault: store.isDefault,
                                })
                              }
                              className={`rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50/60 shadow-sm'
                                  : 'border-slate-200 bg-white hover:border-blue-300'
                              }`}
                              aria-pressed={isSelected}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {store.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {store.code}
                                  </p>
                                </div>
                                <div className="text-right text-xs font-semibold">
                                  <p
                                    className={
                                      store.isActive
                                        ? 'text-emerald-600'
                                        : 'text-rose-600'
                                    }
                                  >
                                    {store.isActive ? 'Online' : 'Paused'}
                                  </p>
                                  {store.isDefault && (
                                    <span className="mt-1 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                                      Default
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                <span>{store.currency ?? 'USD'}</span>
                                <span className="text-slate-400">•</span>
                                <span>
                                  {store.timezone ??
                                    store.settings?.timezone ??
                                    'Timezone'}
                                </span>
                              </div>
                              {store.address?.city && (
                                <p className="mt-2 text-xs text-slate-500">
                                  {store.address.city}
                                  {store.address.country
                                    ? `, ${store.address.country}`
                                    : ''}
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ) : null}

                  {storesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  ) : !hasStores ? (
                    <>
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                        Provide your first store to unlock POS, inventory, and
                        receipt configuration.
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Store Name
                          </label>
                          <input
                            type="text"
                            value={createStoreForm.name}
                            onChange={(event) =>
                              setCreateStoreForm((prev) => ({
                                ...prev,
                                name: event.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Store Code
                          </label>
                          <input
                            type="text"
                            value={createStoreForm.code}
                            onChange={(event) =>
                              setCreateStoreForm((prev) => ({
                                ...prev,
                                code: event.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Primary Phone
                          </label>
                          <input
                            type="tel"
                            value={createStoreForm.phone ?? ''}
                            onChange={(event) => {
                              const phone = event.target.value;
                              setCreateStoreForm((prev) => ({
                                ...prev,
                                phone,
                                contact: { ...(prev.contact ?? {}), phone },
                              }));
                            }}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Primary Email
                          </label>
                          <input
                            type="email"
                            value={createStoreForm.email ?? ''}
                            onChange={(event) => {
                              const email = event.target.value;
                              setCreateStoreForm((prev) => ({
                                ...prev,
                                email,
                                contact: { ...(prev.contact ?? {}), email },
                              }));
                            }}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Currency
                          </label>
                          <select
                            value={createStoreForm.currency ?? 'USD'}
                            onChange={(event) => {
                              const currency = event.target.value;
                              setCreateStoreForm((prev) => ({
                                ...prev,
                                currency,
                                settings: {
                                  ...(prev.settings ?? {}),
                                  currency,
                                },
                              }));
                            }}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                          >
                            {currencyOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Timezone
                          </label>
                          <select
                            value={
                              createStoreForm.timezone ?? 'America/New_York'
                            }
                            onChange={(event) => {
                              const timezone = event.target.value;
                              setCreateStoreForm((prev) => ({
                                ...prev,
                                timezone,
                                settings: {
                                  ...(prev.settings ?? {}),
                                  timezone,
                                },
                              }));
                            }}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                          >
                            {timezoneOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-2">
                            Website
                          </label>
                          <input
                            type="url"
                            value={createStoreForm.contact?.website ?? ''}
                            onChange={(event) => {
                              const website = event.target.value;
                              setCreateStoreForm((prev) => ({
                                ...prev,
                                contact: { ...(prev.contact ?? {}), website },
                              }));
                            }}
                            placeholder="https://example.com"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">
                            Location
                          </h4>
                          <p className="text-xs text-gray-500">
                            Displayed on receipts, invoices, and reports.
                          </p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">
                              Street Address
                            </label>
                            <input
                              type="text"
                              value={createStoreForm.address?.street ?? ''}
                              onChange={(event) => {
                                const street = event.target.value;
                                setCreateStoreForm((prev) => ({
                                  ...prev,
                                  address: { ...(prev.address ?? {}), street },
                                }));
                              }}
                              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              City
                            </label>
                            <input
                              type="text"
                              value={createStoreForm.address?.city ?? ''}
                              onChange={(event) => {
                                const city = event.target.value;
                                setCreateStoreForm((prev) => ({
                                  ...prev,
                                  address: { ...(prev.address ?? {}), city },
                                }));
                              }}
                              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              State / Province
                            </label>
                            <input
                              type="text"
                              value={createStoreForm.address?.state ?? ''}
                              onChange={(event) => {
                                const state = event.target.value;
                                setCreateStoreForm((prev) => ({
                                  ...prev,
                                  address: { ...(prev.address ?? {}), state },
                                }));
                              }}
                              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Postal Code
                            </label>
                            <input
                              type="text"
                              value={createStoreForm.address?.zipCode ?? ''}
                              onChange={(event) => {
                                const zipCode = event.target.value;
                                setCreateStoreForm((prev) => ({
                                  ...prev,
                                  address: { ...(prev.address ?? {}), zipCode },
                                }));
                              }}
                              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Country
                            </label>
                            <input
                              type="text"
                              value={createStoreForm.address?.country ?? ''}
                              onChange={(event) => {
                                const country = event.target.value;
                                setCreateStoreForm((prev) => ({
                                  ...prev,
                                  address: { ...(prev.address ?? {}), country },
                                }));
                              }}
                              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">
                            Business Details
                          </h4>
                          <p className="text-xs text-gray-500">
                            Displayed on fiscal documents, receipts, and
                            statements.
                          </p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Registration Number
                            </label>
                            <input
                              type="text"
                              value={
                                createStoreForm.businessDetails
                                  ?.registrationNumber ?? ''
                              }
                              onChange={(event) => {
                                const registrationNumber = event.target.value;
                                setCreateStoreForm((prev) => ({
                                  ...prev,
                                  businessDetails: {
                                    ...(prev.businessDetails ?? {}),
                                    registrationNumber,
                                  },
                                }));
                              }}
                              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Tax ID
                            </label>
                            <input
                              type="text"
                              value={
                                createStoreForm.businessDetails?.taxId ?? ''
                              }
                              onChange={(event) => {
                                const taxId = event.target.value;
                                setCreateStoreForm((prev) => ({
                                  ...prev,
                                  businessDetails: {
                                    ...(prev.businessDetails ?? {}),
                                    taxId,
                                  },
                                }));
                              }}
                              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Business Type
                            </label>
                            <input
                              type="text"
                              value={
                                createStoreForm.businessDetails?.businessType ??
                                ''
                              }
                              onChange={(event) => {
                                const businessType = event.target.value;
                                setCreateStoreForm((prev) => ({
                                  ...prev,
                                  businessDetails: {
                                    ...(prev.businessDetails ?? {}),
                                    businessType,
                                  },
                                }));
                              }}
                              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">
                            Operational Controls
                          </h4>
                          <p className="text-xs text-gray-500">
                            Manage availability across POS, reporting, and new
                            staff assignments.
                          </p>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <ToggleRow
                            id="create-store-active-toggle"
                            label="Store is active"
                            description="Inactive stores are hidden from POS and cannot receive sales."
                            checked={createStoreForm.isActive ?? true}
                            onChange={(checked) =>
                              setCreateStoreForm((prev) => ({
                                ...prev,
                                isActive: checked,
                              }))
                            }
                          />
                          <ToggleRow
                            id="create-store-default-toggle"
                            label="Mark as default store"
                            description="Default store is pre-selected for sales, inventory, and onboarding."
                            checked={createStoreForm.isDefault ?? false}
                            onChange={(checked) =>
                              setCreateStoreForm((prev) => ({
                                ...prev,
                                isDefault: checked,
                              }))
                            }
                          />
                        </div>
                      </div>

                      {createStoreErrors.length > 0 && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                          <p className="font-medium">
                            Add the missing details before creating the store:
                          </p>
                          <ul className="mt-2 list-disc space-y-1 pl-4">
                            {createStoreErrors.slice(0, 6).map((error) => (
                              <li key={error}>{error}</li>
                            ))}
                            {createStoreErrors.length > 6 && <li>…and more</li>}
                          </ul>
                        </div>
                      )}

                      <button
                        onClick={() =>
                          createStoreMutation.mutate(createStoreForm)
                        }
                        disabled={isCreateStoreSaveDisabled}
                        className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {createStoreMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Create Store
                      </button>
                    </>
                  ) : (
                    <>
                      {storeErrors.length > 0 && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                          <p className="font-medium">
                            Add the missing details before saving:
                          </p>
                          <ul className="mt-2 list-disc space-y-1 pl-4">
                            {storeErrors.slice(0, 6).map((error) => (
                              <li key={error}>{error}</li>
                            ))}
                            {storeErrors.length > 6 && <li>…and more</li>}
                          </ul>
                        </div>
                      )}

                      {storeForm && !isPlaceholderStore && (
                        <>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Store Name
                              </label>
                              <input
                                type="text"
                                value={storeForm.name ?? ''}
                                onChange={(event) =>
                                  setStoreForm((prev) => ({
                                    ...prev,
                                    name: event.target.value,
                                  }))
                                }
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Store Code
                              </label>
                              <input
                                type="text"
                                value={storeForm.code ?? ''}
                                onChange={(event) =>
                                  setStoreForm((prev) => ({
                                    ...prev,
                                    code: event.target.value,
                                  }))
                                }
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Primary Phone
                              </label>
                              <input
                                type="tel"
                                value={storeForm.phone ?? ''}
                                onChange={(event) => {
                                  const phone = event.target.value;
                                  setStoreForm((prev) => ({
                                    ...prev,
                                    phone,
                                    contact: { ...(prev.contact ?? {}), phone },
                                  }));
                                }}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Primary Email
                              </label>
                              <input
                                type="email"
                                value={storeForm.email ?? ''}
                                onChange={(event) => {
                                  const email = event.target.value;
                                  setStoreForm((prev) => ({
                                    ...prev,
                                    email,
                                    contact: { ...(prev.contact ?? {}), email },
                                  }));
                                }}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Currency
                              </label>
                              <select
                                value={storeForm.currency ?? 'USD'}
                                onChange={(event) => {
                                  const currency = event.target.value;
                                  setStoreForm((prev) => ({
                                    ...prev,
                                    currency,
                                    settings: {
                                      ...(prev.settings ?? {}),
                                      currency,
                                    },
                                  }));
                                }}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                              >
                                {currencyOptions.map((option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Timezone
                              </label>
                              <select
                                value={storeForm.timezone ?? 'America/New_York'}
                                onChange={(event) => {
                                  const timezone = event.target.value;
                                  setStoreForm((prev) => ({
                                    ...prev,
                                    timezone,
                                    settings: {
                                      ...(prev.settings ?? {}),
                                      timezone,
                                    },
                                  }));
                                }}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                              >
                                {timezoneOptions.map((option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium mb-2">
                                Website
                              </label>
                              <input
                                type="url"
                                value={storeForm.contact?.website ?? ''}
                                onChange={(event) => {
                                  const website = event.target.value;
                                  setStoreForm((prev) => ({
                                    ...prev,
                                    contact: {
                                      ...(prev.contact ?? {}),
                                      website,
                                    },
                                  }));
                                }}
                                placeholder="https://example.com"
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Store ID
                              </label>
                              <input
                                type="text"
                                value={activeStoreId ?? ''}
                                readOnly
                                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-2 text-sm text-gray-600"
                              />
                            </div>
                          </div>

                          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">
                                Location
                              </h4>
                              <p className="text-xs text-gray-500">
                                Used on receipts, invoices, and reports.
                              </p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">
                                  Street Address
                                </label>
                                <input
                                  type="text"
                                  value={storeForm.address?.street ?? ''}
                                  onChange={(event) => {
                                    const street = event.target.value;
                                    setStoreForm((prev) => ({
                                      ...prev,
                                      address: {
                                        ...(prev.address ?? {}),
                                        street,
                                      },
                                    }));
                                  }}
                                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  City
                                </label>
                                <input
                                  type="text"
                                  value={storeForm.address?.city ?? ''}
                                  onChange={(event) => {
                                    const city = event.target.value;
                                    setStoreForm((prev) => ({
                                      ...prev,
                                      address: {
                                        ...(prev.address ?? {}),
                                        city,
                                      },
                                    }));
                                  }}
                                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  State / Province
                                </label>
                                <input
                                  type="text"
                                  value={storeForm.address?.state ?? ''}
                                  onChange={(event) => {
                                    const state = event.target.value;
                                    setStoreForm((prev) => ({
                                      ...prev,
                                      address: {
                                        ...(prev.address ?? {}),
                                        state,
                                      },
                                    }));
                                  }}
                                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Postal Code
                                </label>
                                <input
                                  type="text"
                                  value={storeForm.address?.zipCode ?? ''}
                                  onChange={(event) => {
                                    const zipCode = event.target.value;
                                    setStoreForm((prev) => ({
                                      ...prev,
                                      address: {
                                        ...(prev.address ?? {}),
                                        zipCode,
                                      },
                                    }));
                                  }}
                                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Country
                                </label>
                                <input
                                  type="text"
                                  value={storeForm.address?.country ?? ''}
                                  onChange={(event) => {
                                    const country = event.target.value;
                                    setStoreForm((prev) => ({
                                      ...prev,
                                      address: {
                                        ...(prev.address ?? {}),
                                        country,
                                      },
                                    }));
                                  }}
                                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">
                                Business Details
                              </h4>
                              <p className="text-xs text-gray-500">
                                Displayed on fiscal documents, receipts, and
                                statements.
                              </p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Registration Number
                                </label>
                                <input
                                  type="text"
                                  value={
                                    storeForm.businessDetails
                                      ?.registrationNumber ?? ''
                                  }
                                  onChange={(event) => {
                                    const registrationNumber =
                                      event.target.value;
                                    setStoreForm((prev) => ({
                                      ...prev,
                                      businessDetails: {
                                        ...(prev.businessDetails ?? {}),
                                        registrationNumber,
                                      },
                                    }));
                                  }}
                                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Tax ID
                                </label>
                                <input
                                  type="text"
                                  value={storeForm.businessDetails?.taxId ?? ''}
                                  onChange={(event) => {
                                    const taxId = event.target.value;
                                    setStoreForm((prev) => ({
                                      ...prev,
                                      businessDetails: {
                                        ...(prev.businessDetails ?? {}),
                                        taxId,
                                      },
                                    }));
                                  }}
                                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Business Type
                                </label>
                                <input
                                  type="text"
                                  value={
                                    storeForm.businessDetails?.businessType ??
                                    ''
                                  }
                                  onChange={(event) => {
                                    const businessType = event.target.value;
                                    setStoreForm((prev) => ({
                                      ...prev,
                                      businessDetails: {
                                        ...(prev.businessDetails ?? {}),
                                        businessType,
                                      },
                                    }));
                                  }}
                                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">
                                Operational Controls
                              </h4>
                              <p className="text-xs text-gray-500">
                                Manage availability across POS, reporting, and
                                new staff assignments.
                              </p>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <ToggleRow
                                id="store-active-toggle"
                                label="Store is active"
                                description="Inactive stores are hidden from POS and cannot receive sales."
                                checked={storeForm.isActive ?? true}
                                onChange={(checked) =>
                                  setStoreForm((prev) => ({
                                    ...prev,
                                    isActive: checked,
                                  }))
                                }
                              />
                              <ToggleRow
                                id="store-default-toggle"
                                label="Mark as default store"
                                description="Default store is pre-selected for sales, inventory, and onboarding."
                                checked={storeForm.isDefault ?? false}
                                onChange={(checked) =>
                                  setStoreForm((prev) => ({
                                    ...prev,
                                    isDefault: checked,
                                  }))
                                }
                                disabled={disableDefaultToggle}
                              />
                            </div>
                            {disableDefaultToggle && (
                              <p className="text-xs text-gray-500">
                                Add another store to change the default
                                assignment.
                              </p>
                            )}
                          </div>
                        </>
                      )}

                      {!isPlaceholderStore && (
                        <button
                          onClick={() => updateStoreMutation.mutate(storeForm)}
                          disabled={isStoreSaveDisabled}
                          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {updateStoreMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Save Store Settings
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Business Settings */}
              {activeTab === 'business' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Business Settings</h3>
                  <p className="text-gray-600">
                    Configure default timezone, currency, and reporting
                    preferences.
                  </p>
                  {businessLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                  ) : businessForm ? (
                    <>
                      <div className="grid md:grid-cols-2 gap-4 mt-6">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Timezone
                          </label>
                          <select
                            value={businessForm.timezone}
                            onChange={(e) =>
                              setBusinessForm((prev) =>
                                prev
                                  ? { ...prev, timezone: e.target.value }
                                  : prev
                              )
                            }
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            {timezoneOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Currency
                          </label>
                          <select
                            value={businessForm.currency}
                            onChange={(e) =>
                              setBusinessForm((prev) =>
                                prev
                                  ? { ...prev, currency: e.target.value }
                                  : prev
                              )
                            }
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            {currencyOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Date Format
                          </label>
                          <select
                            value={businessForm.dateFormat}
                            onChange={(e) =>
                              setBusinessForm((prev) =>
                                prev
                                  ? { ...prev, dateFormat: e.target.value }
                                  : prev
                              )
                            }
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            {dateFormatOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Time Format
                          </label>
                          <select
                            value={businessForm.timeFormat}
                            onChange={(e) =>
                              setBusinessForm((prev) =>
                                prev
                                  ? { ...prev, timeFormat: e.target.value }
                                  : prev
                              )
                            }
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            {timeFormatOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Fiscal Year Start (MM-DD)
                          </label>
                          <input
                            type="text"
                            value={businessForm.fiscalYearStart ?? ''}
                            onChange={(e) =>
                              setBusinessForm((prev) =>
                                prev
                                  ? { ...prev, fiscalYearStart: e.target.value }
                                  : prev
                              )
                            }
                            placeholder="e.g., 01-01"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          businessForm &&
                          updateBusinessMutation.mutate(businessForm)
                        }
                        disabled={updateBusinessMutation.isPending}
                        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {updateBusinessMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save Business Settings
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p>Failed to load business settings. Please try again.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tax Settings */}
              {activeTab === 'tax' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Tax Settings</h3>
                  {taxLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                  ) : taxForm ? (
                    <>
                      <p className="text-gray-600">
                        Configure tax rates, naming, and invoice presentation.
                      </p>

                      <div className="grid md:grid-cols-2 gap-4 mt-6">
                        <div className="flex items-center gap-2 col-span-2">
                          <input
                            type="checkbox"
                            id="tax-enabled"
                            checked={taxForm.enabled}
                            onChange={(e) =>
                              setTaxForm({
                                ...taxForm,
                                enabled: e.target.checked,
                              })
                            }
                            className="w-4 h-4"
                          />
                          <label
                            htmlFor="tax-enabled"
                            className="text-sm font-medium"
                          >
                            Enable tax calculations for this tenant
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Default Tax Rate (%)
                          </label>
                          <input
                            type="number"
                            value={taxForm.defaultRate}
                            onChange={(e) =>
                              setTaxForm({
                                ...taxForm,
                                defaultRate: Number.isNaN(
                                  Number(e.target.value)
                                )
                                  ? taxForm.defaultRate
                                  : parseFloat(e.target.value),
                              })
                            }
                            min="0"
                            max="100"
                            step="0.01"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Tax Label
                          </label>
                          <input
                            type="text"
                            value={taxForm.taxName}
                            onChange={(e) =>
                              setTaxForm({
                                ...taxForm,
                                taxName: e.target.value,
                              })
                            }
                            placeholder="e.g., VAT, GST, Sales Tax"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Tax Number
                          </label>
                          <input
                            type="text"
                            value={taxForm.taxNumber || ''}
                            onChange={(e) =>
                              setTaxForm({
                                ...taxForm,
                                taxNumber: e.target.value,
                              })
                            }
                            placeholder="Business tax identification number"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="tax-inclusive"
                            checked={taxForm.includedInPrice}
                            onChange={(e) =>
                              setTaxForm({
                                ...taxForm,
                                includedInPrice: e.target.checked,
                              })
                            }
                            className="w-4 h-4"
                          />
                          <label
                            htmlFor="tax-inclusive"
                            className="text-sm font-medium"
                          >
                            Tax Inclusive Pricing
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="tax-breakdown"
                            checked={taxForm.showTaxBreakdown}
                            onChange={(e) =>
                              setTaxForm({
                                ...taxForm,
                                showTaxBreakdown: e.target.checked,
                              })
                            }
                            className="w-4 h-4"
                          />
                          <label
                            htmlFor="tax-breakdown"
                            className="text-sm font-medium"
                          >
                            Show Tax Breakdown on Receipt
                          </label>
                        </div>
                      </div>

                      <button
                        onClick={() => updateTaxMutation.mutate(taxForm)}
                        disabled={updateTaxMutation.isPending}
                        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {updateTaxMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save Tax Settings
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p>Failed to load tax settings. Please try again.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Receipt Settings */}
              {activeTab === 'receipt' && (
                <>
                  {receiptLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                  ) : receiptForm ? (
                    <ReceiptDesigner
                      value={receiptForm}
                      onChange={handleReceiptChange}
                      onSave={(settings) =>
                        updateReceiptMutation.mutate(settings)
                      }
                      isSaving={updateReceiptMutation.isPending}
                    />
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p>Failed to load receipt settings. Please try again.</p>
                    </div>
                  )}
                </>
              )}

              {/* POS Settings */}
              {activeTab === 'pos' && (
                <div className="space-y-6">
                  {posLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                  ) : posForm ? (
                    <>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          POS Settings
                        </h3>
                        <p className="text-sm text-gray-600">
                          Configure cashier workflow, hardware behaviour, and
                          automation defaults.
                        </p>
                      </div>

                      <section className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Auto Logout (minutes)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={posForm.autoLogoutMinutes}
                            onChange={(e) =>
                              setPosForm({
                                ...posForm,
                                autoLogoutMinutes: Math.max(
                                  0,
                                  parseInt(e.target.value || '0', 10)
                                ),
                              })
                            }
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Automatically log out active cashier sessions after
                            inactivity.
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Default Payment Method
                          </label>
                          <select
                            value={posForm.defaultPaymentMethod}
                            onChange={(e) =>
                              setPosForm({
                                ...posForm,
                                defaultPaymentMethod: e.target
                                  .value as POSSettings['defaultPaymentMethod'],
                              })
                            }
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="mobile">Mobile Payment</option>
                            <option value="bank">Bank Transfer</option>
                          </select>
                          <p className="mt-1 text-xs text-gray-500">
                            Sets the payment method pre-selected on the POS
                            screen.
                          </p>
                        </div>
                      </section>

                      <section className="grid gap-3 md:grid-cols-2">
                        <ToggleRow
                          id="pos-hardware-barcode"
                          label="Hardware barcode scanner connected"
                          description="Enable hardware-triggered barcode scanning and shortcuts."
                          checked={posForm.barcodeScanner}
                          onChange={(checked) =>
                            setPosForm({
                              ...posForm,
                              barcodeScanner: checked,
                              enableBarcodeScanner: checked,
                            })
                          }
                        />
                        <ToggleRow
                          id="pos-virtual-barcode"
                          label="Virtual barcode scanner workflow"
                          description="Allow manual barcode entry and simulated scans."
                          checked={posForm.enableBarcodeScanner}
                          onChange={(checked) =>
                            setPosForm({
                              ...posForm,
                              enableBarcodeScanner: checked,
                            })
                          }
                        />
                        <ToggleRow
                          id="pos-auto-complete"
                          label="Enable product auto-complete"
                          description="Surface product suggestions while typing."
                          checked={posForm.autoComplete}
                          onChange={(checked) =>
                            setPosForm({ ...posForm, autoComplete: checked })
                          }
                        />
                        <ToggleRow
                          id="pos-sound"
                          label="Play audio feedback on scan"
                          description="Audible confirmation for barcode scans and quick actions."
                          checked={posForm.playSound || posForm.soundEnabled}
                          onChange={(checked) =>
                            setPosForm({
                              ...posForm,
                              playSound: checked,
                              soundEnabled: checked,
                            })
                          }
                        />
                        <ToggleRow
                          id="pos-print"
                          label="Print receipt automatically"
                          description="Generate receipts immediately after completing a sale."
                          checked={posForm.printReceiptAutomatically}
                          onChange={(checked) =>
                            setPosForm({
                              ...posForm,
                              printReceiptAutomatically: checked,
                            })
                          }
                        />
                        <ToggleRow
                          id="pos-customer-display"
                          label="Customer-facing display enabled"
                          description="Show cart totals and promotions on an external screen."
                          checked={posForm.customerDisplayEnabled}
                          onChange={(checked) =>
                            setPosForm({
                              ...posForm,
                              customerDisplayEnabled: checked,
                            })
                          }
                        />
                        <ToggleRow
                          id="pos-show-cost"
                          label="Show cost price to cashiers"
                          description="Expose cost price for training or margin awareness."
                          checked={posForm.showCostPrice}
                          onChange={(checked) =>
                            setPosForm({ ...posForm, showCostPrice: checked })
                          }
                        />
                        <ToggleRow
                          id="pos-require-customer"
                          label="Require customer for all sales"
                          description="Force an associated customer before completing the transaction."
                          checked={posForm.requireCustomer}
                          onChange={(checked) =>
                            setPosForm({ ...posForm, requireCustomer: checked })
                          }
                        />
                        <ToggleRow
                          id="pos-allow-negative"
                          label="Allow negative stock"
                          description="Permit sales even when inventory drops below zero."
                          checked={posForm.allowNegativeStock}
                          onChange={(checked) =>
                            setPosForm({
                              ...posForm,
                              allowNegativeStock: checked,
                            })
                          }
                        />
                      </section>

                      <section className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">
                              Quick payment buttons
                            </h4>
                            <p className="text-xs text-gray-500">
                              Predefined amounts to speed up tendering.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setPosForm({
                                ...posForm,
                                quickPaymentButtons: [10, 20, 50, 100],
                              })
                            }
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Reset defaults
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {posForm.quickPaymentButtons.map((amount, index) => (
                            <span
                              key={`${amount}-${index}`}
                              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700"
                            >
                              ${amount}
                              <button
                                type="button"
                                onClick={() =>
                                  setPosForm({
                                    ...posForm,
                                    quickPaymentButtons:
                                      posForm.quickPaymentButtons.filter(
                                        (_value, i) => i !== index
                                      ),
                                  })
                                }
                                className="text-xs text-red-500 hover:text-red-600"
                              >
                                Remove
                              </button>
                            </span>
                          ))}
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              placeholder="Enter amount"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const input = e.currentTarget;
                                  const value = Number(input.value);
                                  if (Number.isNaN(value) || value <= 0) {
                                    toast.error('Enter a positive number');
                                    input.value = '';
                                    return;
                                  }
                                  setPosForm({
                                    ...posForm,
                                    quickPaymentButtons: [
                                      ...posForm.quickPaymentButtons,
                                      value,
                                    ],
                                  });
                                  input.value = '';
                                }
                              }}
                              className="w-32 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                const input = e.currentTarget
                                  .previousElementSibling as HTMLInputElement;
                                const value = Number(input.value);
                                if (Number.isNaN(value) || value <= 0) {
                                  toast.error('Enter a positive number');
                                  input.value = '';
                                  return;
                                }
                                setPosForm({
                                  ...posForm,
                                  quickPaymentButtons: [
                                    ...posForm.quickPaymentButtons,
                                    value,
                                  ],
                                });
                                input.value = '';
                              }}
                              className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-400 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200"
                            >
                              + Add amount
                            </button>
                          </div>
                        </div>
                      </section>

                      <button
                        onClick={() => updatePOSMutation.mutate(posForm)}
                        disabled={updatePOSMutation.isPending}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {updatePOSMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Save POS Settings
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p>Failed to load POS settings. Please try again.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Settings */}
              {activeTab === 'payments' && (
                <div className="space-y-6">
                  {paymentsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                  ) : paymentForm ? (
                    <>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Payment Settings
                        </h3>
                        <p className="text-sm text-gray-600">
                          Choose accepted payment methods and manage Stripe
                          credentials.
                        </p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <ToggleRow
                          id="payment-cash"
                          label="Allow Cash Payments"
                          description="Enable cash as a tender option on POS and invoices."
                          checked={paymentForm.allowCash}
                          onChange={(checked) => {
                            setPaymentForm((prev) =>
                              prev ? { ...prev, allowCash: checked } : prev
                            );
                            setPaymentDirty(true);
                          }}
                        />
                        <ToggleRow
                          id="payment-card"
                          label="Allow Card Payments"
                          description="Surface card workflows in POS when Stripe is configured."
                          checked={paymentForm.allowCard}
                          onChange={(checked) => {
                            setPaymentForm((prev) =>
                              prev ? { ...prev, allowCard: checked } : prev
                            );
                            setPaymentDirty(true);
                          }}
                        />
                        <ToggleRow
                          id="payment-bank"
                          label="Allow Bank Transfers"
                          description="Permit manual settlements via ACH or IBAN."
                          checked={paymentForm.allowBankTransfer}
                          onChange={(checked) => {
                            setPaymentForm((prev) =>
                              prev
                                ? { ...prev, allowBankTransfer: checked }
                                : prev
                            );
                            setPaymentDirty(true);
                          }}
                        />
                        <ToggleRow
                          id="payment-credit"
                          label="Allow Store Credit"
                          description="Redeem store credit balances at checkout."
                          checked={paymentForm.allowStoreCredit}
                          onChange={(checked) => {
                            setPaymentForm((prev) =>
                              prev
                                ? { ...prev, allowStoreCredit: checked }
                                : prev
                            );
                            setPaymentDirty(true);
                          }}
                        />
                        <ToggleRow
                          id="payment-signature"
                          label="Require Signature for Card Payments"
                          description="Prompt cashiers to capture signatures on card sales."
                          checked={paymentForm.requireSignature}
                          onChange={(checked) => {
                            setPaymentForm((prev) =>
                              prev
                                ? { ...prev, requireSignature: checked }
                                : prev
                            );
                            setPaymentDirty(true);
                          }}
                        />
                        <ToggleRow
                          id="payment-auto-capture"
                          label="Auto Capture Stripe Payments"
                          description="Automatically capture authorised payments immediately."
                          checked={paymentForm.autoCapture}
                          onChange={(checked) => {
                            setPaymentForm((prev) =>
                              prev ? { ...prev, autoCapture: checked } : prev
                            );
                            setPaymentDirty(true);
                          }}
                        />
                      </div>

                      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-base font-semibold text-gray-900">
                              Stripe
                            </h4>
                            <p className="text-xs text-gray-500">
                              Use Stripe to process card payments and store
                              tokens securely.
                            </p>
                          </div>
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <span>Enabled</span>
                            <input
                              type="checkbox"
                              className="h-5 w-5 text-blue-600"
                              checked={paymentForm.stripe.enabled}
                              onChange={(event) => {
                                const enabled = event.target.checked;
                                setPaymentForm((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        stripe: {
                                          ...prev.stripe,
                                          enabled,
                                        },
                                      }
                                    : prev
                                );
                                setPaymentDirty(true);
                              }}
                            />
                          </label>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Publishable Key
                            </label>
                            <input
                              type="text"
                              value={paymentForm.stripe.publishableKey}
                              disabled={!paymentForm.stripe.enabled}
                              onChange={(event) => {
                                const value = event.target.value;
                                setPaymentForm((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        stripe: {
                                          ...prev.stripe,
                                          publishableKey: value,
                                        },
                                      }
                                    : prev
                                );
                                setPaymentDirty(true);
                              }}
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="pk_live_..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Secret Key
                            </label>
                            <input
                              type="password"
                              value={paymentForm.stripe.secretKeyInput}
                              disabled={!paymentForm.stripe.enabled}
                              onChange={(event) => {
                                const value = event.target.value;
                                setPaymentForm((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        stripe: {
                                          ...prev.stripe,
                                          secretKeyInput: value,
                                          clearSecret: false,
                                        },
                                      }
                                    : prev
                                );
                                setPaymentDirty(true);
                              }}
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder={
                                paymentForm.stripe.secretKeySet
                                  ? '********'
                                  : 'sk_live_...'
                              }
                            />
                            {paymentForm.stripe.secretKeySet && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentForm((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          stripe: {
                                            ...prev.stripe,
                                            secretKeyInput: '',
                                            secretKeySet: false,
                                            clearSecret: true,
                                          },
                                        }
                                      : prev
                                  );
                                  setPaymentDirty(true);
                                }}
                                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                              >
                                Clear stored secret
                              </button>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Webhook Secret
                            </label>
                            <input
                              type="password"
                              value={paymentForm.stripe.webhookSecretInput}
                              disabled={!paymentForm.stripe.enabled}
                              onChange={(event) => {
                                const value = event.target.value;
                                setPaymentForm((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        stripe: {
                                          ...prev.stripe,
                                          webhookSecretInput: value,
                                          clearWebhook: false,
                                        },
                                      }
                                    : prev
                                );
                                setPaymentDirty(true);
                              }}
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder={
                                paymentForm.stripe.webhookSecretSet
                                  ? '********'
                                  : 'whsec_...'
                              }
                            />
                            {paymentForm.stripe.webhookSecretSet && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentForm((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          stripe: {
                                            ...prev.stripe,
                                            webhookSecretInput: '',
                                            webhookSecretSet: false,
                                            clearWebhook: true,
                                          },
                                        }
                                      : prev
                                  );
                                  setPaymentDirty(true);
                                }}
                                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                              >
                                Clear stored webhook secret
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
                          <p>
                            Provide Stripe publishable, secret, and webhook
                            secrets. When disabled, card payments are hidden in
                            POS.
                          </p>
                          {paymentForm.stripe.enabled && !isStripeReady && (
                            <p className="mt-2 font-semibold text-amber-600">
                              Complete publishable, secret, and webhook secrets
                              before activating Stripe.
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Last Stripe test
                            </p>
                            <p className="text-xs text-gray-500">
                              {stripeTestStatus}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleStripeTest}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-200"
                            disabled={!isStripeReady || stripeTesting}
                          >
                            {stripeTesting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CreditCard className="h-4 w-4" />
                            )}
                            Test Stripe Connection
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (!paymentSettings) return;
                            setPaymentForm({
                              allowCash: paymentSettings.allowCash,
                              allowCard: paymentSettings.allowCard,
                              allowBankTransfer:
                                paymentSettings.allowBankTransfer,
                              allowStoreCredit:
                                paymentSettings.allowStoreCredit,
                              requireSignature:
                                paymentSettings.requireSignature,
                              autoCapture: paymentSettings.autoCapture,
                              stripe: {
                                enabled: paymentSettings.stripe.enabled,
                                publishableKey:
                                  paymentSettings.stripe.publishableKey,
                                secretKeyInput: '',
                                secretKeySet:
                                  paymentSettings.stripe.secretKeySet,
                                clearSecret: false,
                                webhookSecretInput: '',
                                webhookSecretSet:
                                  paymentSettings.stripe.webhookSecretSet,
                                clearWebhook: false,
                                lastTestedAt:
                                  paymentSettings.stripe.lastTestedAt,
                                lastTestResult:
                                  paymentSettings.stripe.lastTestResult,
                              },
                            });
                            setPaymentDirty(false);
                          }}
                          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                          disabled={
                            updatePaymentMutation.isPending || !paymentDirty
                          }
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const payload = buildPaymentPayload();
                            if (payload) {
                              updatePaymentMutation.mutate(payload);
                            }
                          }}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={
                            updatePaymentMutation.isPending || !paymentDirty
                          }
                        >
                          {updatePaymentMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Save Payment Settings
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p>Failed to load payment settings. Please try again.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Integration Settings */}
              {activeTab === 'integrations' && (
                <div className="space-y-6">
                  {integrationsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                  ) : integrationForm ? (
                    <>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Integrations
                        </h3>
                        <p className="text-sm text-gray-600">
                          Connect ecommerce, accounting, CRM, and webhook
                          endpoints.
                        </p>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-base font-semibold text-gray-900">
                                Shopify
                              </h4>
                              <p className="text-xs text-gray-500">
                                Sync products and inventory with Shopify.
                              </p>
                            </div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                              <span>Enabled</span>
                              <input
                                type="checkbox"
                                className="h-5 w-5 text-blue-600"
                                checked={
                                  integrationForm.ecommerce.shopifyEnabled
                                }
                                onChange={(event) => {
                                  const enabled = event.target.checked;
                                  setIntegrationForm((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          ecommerce: {
                                            ...prev.ecommerce,
                                            shopifyEnabled: enabled,
                                          },
                                        }
                                      : prev
                                  );
                                  setIntegrationDirty(true);
                                }}
                              />
                            </label>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Store Domain
                            </label>
                            <input
                              type="text"
                              value={integrationForm.ecommerce.storeDomain}
                              disabled={
                                !integrationForm.ecommerce.shopifyEnabled
                              }
                              onChange={(event) => {
                                const value = event.target.value;
                                setIntegrationForm((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        ecommerce: {
                                          ...prev.ecommerce,
                                          storeDomain: value,
                                        },
                                      }
                                    : prev
                                );
                                setIntegrationDirty(true);
                              }}
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="my-store.myshopify.com"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Access Token
                            </label>
                            <input
                              type="password"
                              value={integrationForm.ecommerce.accessTokenInput}
                              disabled={
                                !integrationForm.ecommerce.shopifyEnabled
                              }
                              onChange={(event) => {
                                const value = event.target.value;
                                setIntegrationForm((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        ecommerce: {
                                          ...prev.ecommerce,
                                          accessTokenInput: value,
                                          clearAccessToken: false,
                                        },
                                      }
                                    : prev
                                );
                                setIntegrationDirty(true);
                              }}
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder={
                                integrationForm.ecommerce.accessTokenSet
                                  ? '********'
                                  : 'shpat_...'
                              }
                            />
                            {integrationForm.ecommerce.accessTokenSet && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIntegrationForm((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          ecommerce: {
                                            ...prev.ecommerce,
                                            accessTokenInput: '',
                                            accessTokenSet: false,
                                            clearAccessToken: true,
                                          },
                                        }
                                      : prev
                                  );
                                  setIntegrationDirty(true);
                                }}
                                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                              >
                                Clear stored token
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-base font-semibold text-gray-900">
                                QuickBooks
                              </h4>
                              <p className="text-xs text-gray-500">
                                Export financials to QuickBooks Online.
                              </p>
                            </div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                              <span>Enabled</span>
                              <input
                                type="checkbox"
                                className="h-5 w-5 text-blue-600"
                                checked={
                                  integrationForm.accounting.quickbooksEnabled
                                }
                                onChange={(event) => {
                                  const enabled = event.target.checked;
                                  setIntegrationForm((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          accounting: {
                                            ...prev.accounting,
                                            quickbooksEnabled: enabled,
                                          },
                                        }
                                      : prev
                                  );
                                  setIntegrationDirty(true);
                                }}
                              />
                            </label>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Realm ID
                              </label>
                              <input
                                type="text"
                                value={integrationForm.accounting.realmId}
                                disabled={
                                  !integrationForm.accounting.quickbooksEnabled
                                }
                                onChange={(event) => {
                                  const value = event.target.value;
                                  setIntegrationForm((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          accounting: {
                                            ...prev.accounting,
                                            realmId: value,
                                          },
                                        }
                                      : prev
                                  );
                                  setIntegrationDirty(true);
                                }}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Client ID
                              </label>
                              <input
                                type="text"
                                value={integrationForm.accounting.clientId}
                                disabled={
                                  !integrationForm.accounting.quickbooksEnabled
                                }
                                onChange={(event) => {
                                  const value = event.target.value;
                                  setIntegrationForm((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          accounting: {
                                            ...prev.accounting,
                                            clientId: value,
                                          },
                                        }
                                      : prev
                                  );
                                  setIntegrationDirty(true);
                                }}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Client Secret
                            </label>
                            <input
                              type="password"
                              value={
                                integrationForm.accounting.clientSecretInput
                              }
                              disabled={
                                !integrationForm.accounting.quickbooksEnabled
                              }
                              onChange={(event) => {
                                const value = event.target.value;
                                setIntegrationForm((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        accounting: {
                                          ...prev.accounting,
                                          clientSecretInput: value,
                                          clearClientSecret: false,
                                        },
                                      }
                                    : prev
                                );
                                setIntegrationDirty(true);
                              }}
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder={
                                integrationForm.accounting.clientSecretSet
                                  ? '********'
                                  : ''
                              }
                            />
                            {integrationForm.accounting.clientSecretSet && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIntegrationForm((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          accounting: {
                                            ...prev.accounting,
                                            clientSecretInput: '',
                                            clientSecretSet: false,
                                            clearClientSecret: true,
                                          },
                                        }
                                      : prev
                                  );
                                  setIntegrationDirty(true);
                                }}
                                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                              >
                                Clear stored secret
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-base font-semibold text-gray-900">
                                HubSpot
                              </h4>
                              <p className="text-xs text-gray-500">
                                Sync customers and deals to HubSpot CRM.
                              </p>
                            </div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                              <span>Enabled</span>
                              <input
                                type="checkbox"
                                className="h-5 w-5 text-blue-600"
                                checked={integrationForm.crm.hubspotEnabled}
                                onChange={(event) => {
                                  const enabled = event.target.checked;
                                  setIntegrationForm((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          crm: {
                                            ...prev.crm,
                                            hubspotEnabled: enabled,
                                          },
                                        }
                                      : prev
                                  );
                                  setIntegrationDirty(true);
                                }}
                              />
                            </label>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Private App API Key
                            </label>
                            <input
                              type="password"
                              value={integrationForm.crm.apiKeyInput}
                              disabled={!integrationForm.crm.hubspotEnabled}
                              onChange={(event) => {
                                const value = event.target.value;
                                setIntegrationForm((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        crm: {
                                          ...prev.crm,
                                          apiKeyInput: value,
                                          clearApiKey: false,
                                        },
                                      }
                                    : prev
                                );
                                setIntegrationDirty(true);
                              }}
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder={
                                integrationForm.crm.apiKeySet
                                  ? '********'
                                  : 'pat-eu1-...'
                              }
                            />
                            {integrationForm.crm.apiKeySet && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIntegrationForm((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          crm: {
                                            ...prev.crm,
                                            apiKeyInput: '',
                                            apiKeySet: false,
                                            clearApiKey: true,
                                          },
                                        }
                                      : prev
                                  );
                                  setIntegrationDirty(true);
                                }}
                                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                              >
                                Clear stored key
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                          <div>
                            <h4 className="text-base font-semibold text-gray-900">
                              Outbound Webhooks
                            </h4>
                            <p className="text-xs text-gray-500">
                              Notify downstream services when sales or inventory
                              changes occur.
                            </p>
                          </div>
                          <ToggleRow
                            id="webhooks-enabled"
                            label="Enable webhook delivery"
                            description="Send POS and invoice events to your endpoint."
                            checked={integrationForm.webhooks.enabled}
                            onChange={(checked) => {
                              setIntegrationForm((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      webhooks: {
                                        ...prev.webhooks,
                                        enabled: checked,
                                      },
                                    }
                                  : prev
                              );
                              setIntegrationDirty(true);
                            }}
                          />
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Webhook URL
                            </label>
                            <input
                              type="url"
                              value={integrationForm.webhooks.url}
                              disabled={!integrationForm.webhooks.enabled}
                              onChange={(event) => {
                                const value = event.target.value;
                                setIntegrationForm((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        webhooks: {
                                          ...prev.webhooks,
                                          url: value,
                                        },
                                      }
                                    : prev
                                );
                                setIntegrationDirty(true);
                              }}
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="https://example.com/webhooks/candela"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Signing Secret
                            </label>
                            <input
                              type="password"
                              value={integrationForm.webhooks.secretInput}
                              disabled={!integrationForm.webhooks.enabled}
                              onChange={(event) => {
                                const value = event.target.value;
                                setIntegrationForm((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        webhooks: {
                                          ...prev.webhooks,
                                          secretInput: value,
                                          clearSecret: false,
                                        },
                                      }
                                    : prev
                                );
                                setIntegrationDirty(true);
                              }}
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder={
                                integrationForm.webhooks.secretSet
                                  ? '********'
                                  : 'whsec_...'
                              }
                            />
                            {integrationForm.webhooks.secretSet && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIntegrationForm((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          webhooks: {
                                            ...prev.webhooks,
                                            secretInput: '',
                                            secretSet: false,
                                            clearSecret: true,
                                          },
                                        }
                                      : prev
                                  );
                                  setIntegrationDirty(true);
                                }}
                                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                              >
                                Clear stored secret
                              </button>
                            )}
                          </div>
                          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
                            <p>
                              Record deliveries and verify the signature with
                              this secret. Testing utilities appear in a later
                              release.
                            </p>
                            <p className="mt-1 text-gray-500">
                              Last status: {webhookTestStatus}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (integrationSettings) {
                              setIntegrationForm({
                                ecommerce: {
                                  shopifyEnabled:
                                    integrationSettings.ecommerce.shopify
                                      .enabled,
                                  storeDomain:
                                    integrationSettings.ecommerce.shopify
                                      .storeDomain || '',
                                  accessTokenInput: '',
                                  accessTokenSet:
                                    integrationSettings.ecommerce.shopify
                                      .accessTokenSet,
                                  clearAccessToken: false,
                                },
                                accounting: {
                                  quickbooksEnabled:
                                    integrationSettings.accounting.quickbooks
                                      .enabled,
                                  realmId:
                                    integrationSettings.accounting.quickbooks
                                      .realmId || '',
                                  clientId:
                                    integrationSettings.accounting.quickbooks
                                      .clientId || '',
                                  clientSecretInput: '',
                                  clientSecretSet:
                                    integrationSettings.accounting.quickbooks
                                      .clientSecretSet,
                                  clearClientSecret: false,
                                },
                                crm: {
                                  hubspotEnabled:
                                    integrationSettings.crm.hubspot.enabled,
                                  apiKeyInput: '',
                                  apiKeySet:
                                    integrationSettings.crm.hubspot.apiKeySet,
                                  clearApiKey: false,
                                },
                                webhooks: {
                                  enabled: integrationSettings.webhooks.enabled,
                                  url: integrationSettings.webhooks.url || '',
                                  secretInput: '',
                                  secretSet:
                                    integrationSettings.webhooks.secretSet,
                                  clearSecret: false,
                                  lastTestedAt:
                                    integrationSettings.webhooks.lastTestedAt,
                                  lastTestResult:
                                    integrationSettings.webhooks.lastTestResult,
                                },
                              });
                              setIntegrationDirty(false);
                            }
                          }}
                          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                          disabled={
                            updateIntegrationMutation.isPending ||
                            !integrationDirty
                          }
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const payload = buildIntegrationPayload();
                            if (payload) {
                              updateIntegrationMutation.mutate(payload);
                            }
                          }}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={
                            updateIntegrationMutation.isPending ||
                            !integrationDirty
                          }
                        >
                          {updateIntegrationMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Save Integration Settings
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p>
                        Failed to load integration settings. Please try again.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Compliance Settings */}
              {activeTab === 'compliance' && (
                <div className="space-y-6">
                  {complianceLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                  ) : complianceForm ? (
                    <>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Compliance & Security
                        </h3>
                        <p className="text-sm text-gray-600">
                          Enforce security and retention policies for this
                          tenant.
                        </p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <ToggleRow
                          id="compliance-2fa"
                          label="Require Two-Factor Authentication"
                          description="Force users to enable 2FA before accessing sensitive areas."
                          checked={complianceForm.requireTwoFactor}
                          onChange={(checked) => {
                            setComplianceForm((prev) =>
                              prev
                                ? { ...prev, requireTwoFactor: checked }
                                : prev
                            );
                            setComplianceDirty(true);
                          }}
                        />
                        <ToggleRow
                          id="compliance-export"
                          label="Allow Data Export"
                          description="Allow CSV or Excel exports from reporting screens."
                          checked={complianceForm.allowDataExport}
                          onChange={(checked) => {
                            setComplianceForm((prev) =>
                              prev
                                ? { ...prev, allowDataExport: checked }
                                : prev
                            );
                            setComplianceDirty(true);
                          }}
                        />
                        <ToggleRow
                          id="compliance-audit-purge"
                          label="Auto purge audit logs"
                          description="Automatically delete audit history after the retention window."
                          checked={complianceForm.autoPurgeAuditLogs}
                          onChange={(checked) => {
                            setComplianceForm((prev) =>
                              prev
                                ? { ...prev, autoPurgeAuditLogs: checked }
                                : prev
                            );
                            setComplianceDirty(true);
                          }}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Session Timeout (minutes)
                          </label>
                          <input
                            type="number"
                            min={5}
                            value={complianceForm.sessionTimeoutMinutes}
                            onChange={(event) => {
                              const value = parseInt(event.target.value, 10);
                              setComplianceForm((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      sessionTimeoutMinutes: Number.isNaN(value)
                                        ? prev.sessionTimeoutMinutes
                                        : Math.max(5, value),
                                    }
                                  : prev
                              );
                              setComplianceDirty(true);
                            }}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Data Retention (days)
                          </label>
                          <input
                            type="number"
                            min={30}
                            value={complianceForm.dataRetentionDays}
                            onChange={(event) => {
                              const value = parseInt(event.target.value, 10);
                              setComplianceForm((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      dataRetentionDays: Number.isNaN(value)
                                        ? prev.dataRetentionDays
                                        : Math.max(30, value),
                                    }
                                  : prev
                              );
                              setComplianceDirty(true);
                            }}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Audit Notification Emails
                        </label>
                        <textarea
                          value={complianceForm.auditEmailsText}
                          onChange={(event) =>
                            handleComplianceEmailsChange(event.target.value)
                          }
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          placeholder="security@example.com, auditors@example.com"
                        />
                        <p className="mt-2 text-xs text-gray-500">
                          Separate addresses with commas. Alerts trigger when
                          audit anomalies occur.
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (complianceSettings) {
                              setComplianceForm({
                                ...complianceSettings,
                                auditEmailsText:
                                  complianceSettings.auditNotificationEmails.join(
                                    ', '
                                  ),
                              });
                              setComplianceDirty(false);
                            }
                          }}
                          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                          disabled={
                            updateComplianceMutation.isPending ||
                            !complianceDirty
                          }
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const payload = buildCompliancePayload();
                            if (payload) {
                              updateComplianceMutation.mutate(payload);
                            }
                          }}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={
                            updateComplianceMutation.isPending ||
                            !complianceDirty
                          }
                        >
                          {updateComplianceMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Save Compliance Settings
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p>
                        Failed to load compliance settings. Please try again.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Communication Settings */}
              {activeTab === 'communications' && <CommunicationSettingsForm />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface ToggleRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
}: ToggleRowProps) {
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm transition ${
        disabled
          ? 'cursor-not-allowed opacity-60'
          : 'cursor-pointer hover:border-blue-300'
      }`}
    >
      <input
        id={id}
        type="checkbox"
        className="mt-1 h-5 w-5 text-blue-600"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
      />
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </label>
  );
}
