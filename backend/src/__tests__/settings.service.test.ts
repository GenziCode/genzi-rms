import { SettingsService } from '../services/settings.service';

describe('SettingsService.updateCommunicationSettings', () => {
  const tenantId = 'tenant-1';
  const userId = 'user-1';

  const buildMockSettings = () => {
    const settings: any = {
      notifications: {
        emailNotifications: true,
        smsNotifications: true,
        emailConfig: {
          enabled: true,
          host: 'smtp.old.example.com',
          port: 2525,
          secure: false,
          user: 'old-user',
          password: 'old-password',
          fromEmail: 'old@example.com',
          replyTo: 'reply@example.com',
          lastTestedAt: new Date('2024-01-01T00:00:00Z'),
          lastTestResult: 'success',
        },
        smsConfig: {
          enabled: true,
          provider: 'twilio',
          accountSid: 'AC123',
          authToken: 'auth-token',
          fromNumber: '+15555550123',
          lastTestedAt: new Date('2024-01-02T00:00:00Z'),
          lastTestResult: 'success',
        },
      },
      updatedBy: undefined,
      markModified: jest.fn(),
      save: jest.fn(),
    };
    return settings;
  };

  it('clears SMTP credentials when disabling email config', async () => {
    const service = new SettingsService();
    const mockSettings = buildMockSettings();

    jest.spyOn<any, any>(service, 'ensureSettings').mockResolvedValue(mockSettings);

    const result = await service.updateCommunicationSettings(tenantId, userId, {
      emailConfig: { enabled: false },
    });

    expect(mockSettings.notifications.emailConfig.enabled).toBe(false);
    expect(mockSettings.notifications.emailConfig.host).toBeUndefined();
    expect(mockSettings.notifications.emailConfig.user).toBeUndefined();
    expect(mockSettings.notifications.emailConfig.password).toBeUndefined();
    expect(mockSettings.notifications.emailConfig.port).toBe(587);
    expect(mockSettings.notifications.emailConfig.lastTestedAt).toBeUndefined();
    expect(mockSettings.notifications.emailConfig.lastTestResult).toBeUndefined();
    expect(mockSettings.save).toHaveBeenCalled();

    expect(result.emailConfig.enabled).toBe(false);
    expect(result.emailConfig.passwordSet).toBe(false);
  });

  it('trims and sets new credentials while resetting last test metadata', async () => {
    const service = new SettingsService();
    const mockSettings = buildMockSettings();

    jest.spyOn<any, any>(service, 'ensureSettings').mockResolvedValue(mockSettings);

    const result = await service.updateCommunicationSettings(tenantId, userId, {
      emailConfig: {
        enabled: true,
        host: ' smtp.new.example.com ',
        user: ' new-user ',
        password: ' new-password ',
        port: 465,
        secure: true,
        fromEmail: ' billing@example.com ',
      },
      smsConfig: {
        enabled: true,
        accountSid: ' AC999 ',
        authToken: ' new-token ',
        fromNumber: ' +19998887777 ',
      },
    });

    expect(mockSettings.notifications.emailConfig.host).toBe('smtp.new.example.com');
    expect(mockSettings.notifications.emailConfig.user).toBe('new-user');
    expect(mockSettings.notifications.emailConfig.password).toBe('new-password');
    expect(mockSettings.notifications.emailConfig.port).toBe(465);
    expect(mockSettings.notifications.emailConfig.secure).toBe(true);
    expect(mockSettings.notifications.emailConfig.fromEmail).toBe('billing@example.com');
    expect(mockSettings.notifications.emailConfig.lastTestedAt).toBeUndefined();
    expect(mockSettings.notifications.emailConfig.lastTestResult).toBeUndefined();

    expect(mockSettings.notifications.smsConfig.accountSid).toBe('AC999');
    expect(mockSettings.notifications.smsConfig.authToken).toBe('new-token');
    expect(mockSettings.notifications.smsConfig.fromNumber).toBe('+19998887777');
    expect(mockSettings.notifications.smsConfig.lastTestedAt).toBeUndefined();
    expect(mockSettings.notifications.smsConfig.lastTestResult).toBeUndefined();

    expect(mockSettings.save).toHaveBeenCalled();
    expect(result.emailConfig.passwordSet).toBe(true);
    expect(result.smsConfig.authTokenSet).toBe(true);
  });
});

describe('SettingsService.updatePaymentSettings', () => {
  const tenantId = 'tenant-1';
  const userId = 'user-1';

  const buildMockSettings = () => ({
    payments: {
      allowCash: true,
      allowCard: true,
      allowBankTransfer: false,
      allowStoreCredit: false,
      requireSignature: false,
      autoCapture: true,
      stripe: {
        enabled: false,
      },
    },
    markModified: jest.fn(),
    save: jest.fn(),
  }) as any;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('enables Stripe and trims credentials', async () => {
    const service = new SettingsService();
    const mockSettings = buildMockSettings();
    jest.spyOn<any, any>(service, 'ensureSettings').mockResolvedValue(mockSettings);

    const result = await service.updatePaymentSettings(tenantId, userId, {
      allowCash: false,
      stripe: {
        enabled: true,
        publishableKey: ' pk_live_123 ',
        secretKey: ' sk_live_123 ',
        webhookSecret: ' whsec_456 ',
      },
    });

    expect(mockSettings.payments.allowCash).toBe(false);
    expect(mockSettings.payments.stripe.enabled).toBe(true);
    expect(mockSettings.payments.stripe.publishableKey).toBe('pk_live_123');
    expect(mockSettings.payments.stripe.secretKey).toBe('sk_live_123');
    expect(mockSettings.payments.stripe.webhookSecret).toBe('whsec_456');
    expect(result.stripe.secretKeySet).toBe(true);
    expect(result.stripe.webhookSecretSet).toBe(true);
    expect(mockSettings.markModified).toHaveBeenCalledWith('payments');
    expect(mockSettings.save).toHaveBeenCalled();
  });

  it('clears Stripe secrets when null provided', async () => {
    const service = new SettingsService();
    const mockSettings = buildMockSettings();
    mockSettings.payments.stripe = {
      enabled: true,
      publishableKey: 'pk_live_123',
      secretKey: 'sk_live_123',
      webhookSecret: 'whsec_456',
    } as any;
    jest.spyOn<any, any>(service, 'ensureSettings').mockResolvedValue(mockSettings);

    const result = await service.updatePaymentSettings(tenantId, userId, {
      stripe: {
        secretKey: null,
        webhookSecret: null,
      },
    });

    expect(mockSettings.payments.stripe.secretKey).toBeUndefined();
    expect(mockSettings.payments.stripe.webhookSecret).toBeUndefined();
    expect(result.stripe.secretKeySet).toBe(false);
    expect(result.stripe.webhookSecretSet).toBe(false);
  });
});

describe('SettingsService.updateIntegrationSettings', () => {
  const tenantId = 'tenant-1';
  const userId = 'user-1';

  const buildMockSettings = () => ({
    integrations: {
      ecommerce: { shopify: { enabled: false } as any },
      accounting: { quickbooks: { enabled: false } as any },
      crm: { hubspot: { enabled: false } as any },
      webhooks: { enabled: false } as any,
    },
    markModified: jest.fn(),
    save: jest.fn(),
  }) as any;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('updates integration credentials and trims values', async () => {
    const service = new SettingsService();
    const mockSettings = buildMockSettings();
    jest.spyOn<any, any>(service, 'ensureSettings').mockResolvedValue(mockSettings);

    const result = await service.updateIntegrationSettings(tenantId, userId, {
      ecommerce: {
        shopify: {
          enabled: true,
          storeDomain: ' demo.myshopify.com ',
          accessToken: ' shpat_token ',
        },
      },
      accounting: {
        quickbooks: {
          enabled: true,
          realmId: ' 123 ',
          clientId: ' cid ',
          clientSecret: ' secret ',
        },
      },
      crm: {
        hubspot: {
          enabled: true,
          apiKey: ' pat ',
        },
      },
      webhooks: {
        enabled: true,
        url: ' https://example.com/hook ',
        secret: ' whsec ',
      },
    });

    expect(result.ecommerce.shopify.enabled).toBe(true);
    expect(result.ecommerce.shopify.storeDomain).toBe('demo.myshopify.com');
    expect(result.ecommerce.shopify.accessTokenSet).toBe(true);
    expect(result.accounting.quickbooks.realmId).toBe('123');
    expect(result.accounting.quickbooks.clientSecretSet).toBe(true);
    expect(result.crm.hubspot.apiKeySet).toBe(true);
    expect(result.webhooks.url).toBe('https://example.com/hook');
    expect(result.webhooks.secretSet).toBe(true);
    expect(mockSettings.markModified).toHaveBeenCalledWith('integrations');
    expect(mockSettings.save).toHaveBeenCalled();
  });

  it('clears integration secrets when null is provided', async () => {
    const service = new SettingsService();
    const mockSettings = buildMockSettings();
    mockSettings.integrations.ecommerce.shopify = {
      enabled: true,
      accessToken: 'token',
    } as any;
    mockSettings.integrations.accounting.quickbooks = {
      enabled: true,
      clientSecret: 'secret',
    } as any;
    mockSettings.integrations.crm.hubspot = {
      enabled: true,
      apiKey: 'key',
    } as any;
    mockSettings.integrations.webhooks = {
      enabled: true,
      secret: 'whsec',
    } as any;
    jest.spyOn<any, any>(service, 'ensureSettings').mockResolvedValue(mockSettings);

    const result = await service.updateIntegrationSettings(tenantId, userId, {
      ecommerce: { shopify: { accessToken: null } },
      accounting: { quickbooks: { clientSecret: null } },
      crm: { hubspot: { apiKey: null } },
      webhooks: { secret: null },
    });

    expect(result.ecommerce.shopify.accessTokenSet).toBe(false);
    expect(result.accounting.quickbooks.clientSecretSet).toBe(false);
    expect(result.crm.hubspot.apiKeySet).toBe(false);
    expect(result.webhooks.secretSet).toBe(false);
  });
});

describe('SettingsService.updateComplianceSettings', () => {
  const tenantId = 'tenant-1';
  const userId = 'user-1';

  const buildMockSettings = () => ({
    compliance: {
      requireTwoFactor: false,
      sessionTimeoutMinutes: 30,
      dataRetentionDays: 365,
      allowDataExport: true,
      autoPurgeAuditLogs: false,
      auditNotificationEmails: ['ops@example.com'],
    },
    markModified: jest.fn(),
    save: jest.fn(),
  }) as any;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('updates compliance policies and trims notification emails', async () => {
    const service = new SettingsService();
    const mockSettings = buildMockSettings();
    jest.spyOn<any, any>(service, 'ensureSettings').mockResolvedValue(mockSettings);

    const result = await service.updateComplianceSettings(tenantId, userId, {
      requireTwoFactor: true,
      sessionTimeoutMinutes: 60,
      dataRetentionDays: 730,
      allowDataExport: false,
      autoPurgeAuditLogs: true,
      auditNotificationEmails: [' security@example.com ', 'audit@example.com '],
    });

    expect(result.requireTwoFactor).toBe(true);
    expect(result.sessionTimeoutMinutes).toBe(60);
    expect(result.dataRetentionDays).toBe(730);
    expect(result.allowDataExport).toBe(false);
    expect(result.autoPurgeAuditLogs).toBe(true);
    expect(result.auditNotificationEmails).toEqual([
      'security@example.com',
      'audit@example.com',
    ]);
    expect(mockSettings.markModified).toHaveBeenCalledWith('compliance');
    expect(mockSettings.save).toHaveBeenCalled();
  });
});


