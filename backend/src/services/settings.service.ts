import { getTenantConnection } from '../config/database';
import { SettingsSchema, ISettings } from '../models/settings.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export class SettingsService {
  private async getSettingsModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<ISettings>('Settings', SettingsSchema);
  }

  private toPlain<T>(doc: T): T {
    if (doc && typeof (doc as any).toObject === 'function') {
      return (doc as any).toObject();
    }
    return doc;
  }

  private async ensureSettings(tenantId: string, storeName?: string): Promise<ISettings> {
    const Settings = await this.getSettingsModel(tenantId);

    let settings = await Settings.findOne({ tenantId });

    if (!settings) {
      settings = new Settings({
        tenantId,
        store: {
          name: storeName || 'Main Store',
        },
      });
      await settings.save();
      logger.info(`Default settings created for tenant: ${tenantId}`);
    }

    return settings;
  }

  /**
   * Get or create settings
   */
  async getSettings(tenantId: string, storeName: string): Promise<ISettings> {
    try {
      return await this.ensureSettings(tenantId, storeName);
    } catch (error) {
      logger.error('Error getting settings:', error);
      throw error;
    }
  }

  async getBusinessSettings(tenantId: string) {
    const settings = await this.ensureSettings(tenantId);
    return this.toPlain(settings.business);
  }

  async getTaxSettings(tenantId: string) {
    const settings = await this.ensureSettings(tenantId);
    return this.toPlain(settings.tax);
  }

  async getReceiptSettings(tenantId: string) {
    const settings = await this.ensureSettings(tenantId);
    return this.toPlain(settings.receipt);
  }

  async getPOSSettings(tenantId: string) {
    const settings = await this.ensureSettings(tenantId);
    return this.toPlain(settings.pos);
  }

  async getPaymentSettings(tenantId: string) {
    const settings = await this.ensureSettings(tenantId);
    const payments = settings.payments || (settings.payments = {} as any);
    const stripe = payments.stripe || {};

    return {
      allowCash: payments.allowCash ?? true,
      allowCard: payments.allowCard ?? true,
      allowBankTransfer: payments.allowBankTransfer ?? false,
      allowStoreCredit: payments.allowStoreCredit ?? false,
      requireSignature: payments.requireSignature ?? false,
      autoCapture: payments.autoCapture ?? true,
      stripe: {
        enabled: stripe.enabled ?? false,
        publishableKey: stripe.publishableKey || '',
        secretKeySet: Boolean(stripe.secretKey),
        webhookSecretSet: Boolean(stripe.webhookSecret),
        lastTestedAt: stripe.lastTestedAt,
        lastTestResult: stripe.lastTestResult,
      },
    };
  }

  async getIntegrationSettings(tenantId: string) {
    const settings = await this.ensureSettings(tenantId);
    const integrations = settings.integrations || (settings.integrations = {} as any);
    const ecommerce = integrations.ecommerce || {};
    const shopify = ecommerce.shopify || {};
    const accounting = integrations.accounting || {};
    const quickbooks = accounting.quickbooks || {};
    const crm = integrations.crm || {};
    const hubspot = crm.hubspot || {};
    const webhooks = integrations.webhooks || {};

    return {
      ecommerce: {
        shopify: {
          enabled: shopify.enabled ?? false,
          storeDomain: shopify.storeDomain || '',
          accessTokenSet: Boolean(shopify.accessToken),
        },
      },
      accounting: {
        quickbooks: {
          enabled: quickbooks.enabled ?? false,
          realmId: quickbooks.realmId || '',
          clientId: quickbooks.clientId || '',
          clientSecretSet: Boolean(quickbooks.clientSecret),
        },
      },
      crm: {
        hubspot: {
          enabled: hubspot.enabled ?? false,
          apiKeySet: Boolean(hubspot.apiKey),
        },
      },
      webhooks: {
        enabled: webhooks.enabled ?? false,
        url: webhooks.url || '',
        secretSet: Boolean(webhooks.secret),
        lastTestedAt: webhooks.lastTestedAt,
        lastTestResult: webhooks.lastTestResult,
      },
    };
  }

  async getComplianceSettings(tenantId: string) {
    const settings = await this.ensureSettings(tenantId);
    const compliance = settings.compliance || (settings.compliance = {} as any);

    return {
      requireTwoFactor: compliance.requireTwoFactor ?? false,
      sessionTimeoutMinutes: compliance.sessionTimeoutMinutes ?? 30,
      dataRetentionDays: compliance.dataRetentionDays ?? 365,
      allowDataExport: compliance.allowDataExport ?? true,
      autoPurgeAuditLogs: compliance.autoPurgeAuditLogs ?? false,
      auditNotificationEmails: Array.isArray(compliance.auditNotificationEmails)
        ? compliance.auditNotificationEmails
        : [],
    };
  }

  /**
   * Update store settings
   */
  async updateStoreSettings(
    tenantId: string,
    userId: string,
    data: Partial<ISettings['store']>
  ): Promise<ISettings['store']> {
    try {
      const Settings = await this.getSettingsModel(tenantId);

      let settings = await Settings.findOne({ tenantId });
      if (!settings) {
        throw new AppError('Settings not found', 404);
      }

      Object.assign(settings.store, data);
      settings.updatedBy = userId as any;
      await settings.save();

      logger.info(`Store settings updated for tenant: ${tenantId}`);
      return this.toPlain(settings.store);
    } catch (error) {
      logger.error('Error updating store settings:', error);
      throw error;
    }
  }

  /**
   * Update business settings
   */
  async updateBusinessSettings(
    tenantId: string,
    userId: string,
    data: Partial<ISettings['business']>
  ): Promise<ISettings['business']> {
    try {
      const Settings = await this.getSettingsModel(tenantId);

      let settings = await Settings.findOne({ tenantId });
      if (!settings) {
        throw new AppError('Settings not found', 404);
      }

      Object.assign(settings.business, data);
      settings.updatedBy = userId as any;
      await settings.save();

      logger.info(`Business settings updated for tenant: ${tenantId}`);
      return this.toPlain(settings.business);
    } catch (error) {
      logger.error('Error updating business settings:', error);
      throw error;
    }
  }

  /**
   * Update tax settings
   */
  async updateTaxSettings(
    tenantId: string,
    userId: string,
    data: Partial<ISettings['tax']>
  ): Promise<ISettings['tax']> {
    try {
      const Settings = await this.getSettingsModel(tenantId);

      let settings = await Settings.findOne({ tenantId });
      if (!settings) {
        throw new AppError('Settings not found', 404);
      }

      Object.assign(settings.tax, data);
      settings.updatedBy = userId as any;
      await settings.save();

      logger.info(`Tax settings updated for tenant: ${tenantId}`);
      return this.toPlain(settings.tax);
    } catch (error) {
      logger.error('Error updating tax settings:', error);
      throw error;
    }
  }

  /**
   * Update receipt settings
   */
  async updateReceiptSettings(
    tenantId: string,
    userId: string,
    data: Partial<ISettings['receipt']>
  ): Promise<ISettings['receipt']> {
    try {
      const Settings = await this.getSettingsModel(tenantId);

      let settings = await Settings.findOne({ tenantId });
      if (!settings) {
        throw new AppError('Settings not found', 404);
      }

      Object.assign(settings.receipt, data);
      settings.updatedBy = userId as any;
      await settings.save();

      logger.info(`Receipt settings updated for tenant: ${tenantId}`);
      return this.toPlain(settings.receipt);
    } catch (error) {
      logger.error('Error updating receipt settings:', error);
      throw error;
    }
  }

  /**
   * Update POS settings
   */
  async updatePOSSettings(
    tenantId: string,
    userId: string,
    data: Partial<ISettings['pos']>
  ): Promise<ISettings['pos']> {
    try {
      const Settings = await this.getSettingsModel(tenantId);

      let settings = await Settings.findOne({ tenantId });
      if (!settings) {
        throw new AppError('Settings not found', 404);
      }

      Object.assign(settings.pos, data);
      settings.updatedBy = userId as any;
      await settings.save();

      logger.info(`POS settings updated for tenant: ${tenantId}`);
      return this.toPlain(settings.pos);
    } catch (error) {
      logger.error('Error updating POS settings:', error);
      throw error;
    }
  }

  /**
   * Get communication (email/SMS) settings
   */
  async getCommunicationSettings(tenantId: string) {
    try {
      const settings = await this.ensureSettings(tenantId);
      const notifications = settings.notifications || ({} as ISettings['notifications']);
      const emailConfig = notifications.emailConfig || {
        enabled: false,
        secure: false,
        port: 587,
      };
      const smsConfig = notifications.smsConfig || {
        enabled: false,
        provider: 'twilio' as const,
      };

      return {
        emailNotifications: notifications.emailNotifications ?? false,
        smsNotifications: notifications.smsNotifications ?? false,
        emailConfig: {
          enabled: emailConfig.enabled ?? false,
          host: emailConfig.host || '',
          port: emailConfig.port ?? 587,
          secure: emailConfig.secure ?? false,
          user: emailConfig.user || '',
          fromEmail: emailConfig.fromEmail || '',
          replyTo: emailConfig.replyTo || '',
          lastTestedAt: emailConfig.lastTestedAt,
          lastTestResult: emailConfig.lastTestResult,
          passwordSet: Boolean(emailConfig.password),
        },
        smsConfig: {
          enabled: smsConfig.enabled ?? false,
          provider: smsConfig.provider || 'twilio',
          accountSid: smsConfig.accountSid || '',
          fromNumber: smsConfig.fromNumber || '',
          lastTestedAt: smsConfig.lastTestedAt,
          lastTestResult: smsConfig.lastTestResult,
          authTokenSet: Boolean(smsConfig.authToken),
        },
      };
    } catch (error) {
      logger.error('Error getting communication settings:', error);
      throw error;
    }
  }

  /**
   * Update communication (email/SMS) settings
   */
  async updateCommunicationSettings(
    tenantId: string,
    userId: string,
    data: {
      emailNotifications?: boolean;
      smsNotifications?: boolean;
      emailConfig?: {
        enabled?: boolean;
        host?: string;
        port?: number;
        secure?: boolean;
        user?: string;
        password?: string | null;
        fromEmail?: string;
        replyTo?: string;
      };
      smsConfig?: {
        enabled?: boolean;
        provider?: 'twilio';
        accountSid?: string;
        authToken?: string | null;
        fromNumber?: string;
      };
    }
  ) {
    try {
      const settings = await this.ensureSettings(tenantId);
      const notifications = settings.notifications;

      if (typeof data.emailNotifications === 'boolean') {
        notifications.emailNotifications = data.emailNotifications;
      }

      if (typeof data.smsNotifications === 'boolean') {
        notifications.smsNotifications = data.smsNotifications;
      }

      if (data.emailConfig) {
        const emailConfig = notifications.emailConfig || {
          enabled: false,
          port: 587,
          secure: false,
        };

        const prevHash = JSON.stringify({
          host: emailConfig.host,
          port: emailConfig.port,
          secure: emailConfig.secure,
          user: emailConfig.user,
          fromEmail: emailConfig.fromEmail,
          replyTo: emailConfig.replyTo,
        });

        if (typeof data.emailConfig.enabled === 'boolean') {
          emailConfig.enabled = data.emailConfig.enabled;
        }
        if (data.emailConfig.host !== undefined) {
          emailConfig.host = data.emailConfig.host?.trim() || undefined;
        }
        if (data.emailConfig.port !== undefined) {
          emailConfig.port = Number.isFinite(data.emailConfig.port)
            ? data.emailConfig.port
            : emailConfig.port ?? 587;
        }
        if (typeof data.emailConfig.secure === 'boolean') {
          emailConfig.secure = data.emailConfig.secure;
        }
        if (data.emailConfig.user !== undefined) {
          emailConfig.user = data.emailConfig.user?.trim() || undefined;
        }
        if (data.emailConfig.fromEmail !== undefined) {
          emailConfig.fromEmail = data.emailConfig.fromEmail?.trim() || undefined;
        }
        if (data.emailConfig.replyTo !== undefined) {
          emailConfig.replyTo = data.emailConfig.replyTo?.trim() || undefined;
        }
        if (data.emailConfig.password !== undefined) {
          if (data.emailConfig.password === null) {
            emailConfig.password = undefined;
          } else if (data.emailConfig.password.trim().length > 0) {
            emailConfig.password = data.emailConfig.password.trim();
          }
        }

        const nextHash = JSON.stringify({
          host: emailConfig.host,
          port: emailConfig.port,
          secure: emailConfig.secure,
          user: emailConfig.user,
          fromEmail: emailConfig.fromEmail,
          replyTo: emailConfig.replyTo,
        });

        if (prevHash !== nextHash || data.emailConfig.password !== undefined) {
          emailConfig.lastTestedAt = undefined;
          emailConfig.lastTestResult = undefined;
        }

        if (!emailConfig.enabled) {
          emailConfig.host = undefined;
          emailConfig.port = 587;
          emailConfig.secure = false;
          emailConfig.user = undefined;
          emailConfig.password = undefined;
          emailConfig.fromEmail = undefined;
          emailConfig.replyTo = undefined;
          emailConfig.lastTestedAt = undefined;
          emailConfig.lastTestResult = undefined;
        }

        notifications.emailConfig = emailConfig;
      }

      if (data.smsConfig) {
        const smsConfig = notifications.smsConfig || {
          enabled: false,
          provider: 'twilio' as const,
        };

        const prevHash = JSON.stringify({
          provider: smsConfig.provider,
          accountSid: smsConfig.accountSid,
          fromNumber: smsConfig.fromNumber,
        });

        if (typeof data.smsConfig.enabled === 'boolean') {
          smsConfig.enabled = data.smsConfig.enabled;
        }
        if (data.smsConfig.provider) {
          smsConfig.provider = data.smsConfig.provider;
        }
        if (data.smsConfig.accountSid !== undefined) {
          smsConfig.accountSid = data.smsConfig.accountSid?.trim() || undefined;
        }
        if (data.smsConfig.fromNumber !== undefined) {
          smsConfig.fromNumber = data.smsConfig.fromNumber?.trim() || undefined;
        }
        if (data.smsConfig.authToken !== undefined) {
          if (data.smsConfig.authToken === null) {
            smsConfig.authToken = undefined;
          } else if (data.smsConfig.authToken.trim().length > 0) {
            smsConfig.authToken = data.smsConfig.authToken.trim();
          }
        }

        const nextHash = JSON.stringify({
          provider: smsConfig.provider,
          accountSid: smsConfig.accountSid,
          fromNumber: smsConfig.fromNumber,
        });

        if (prevHash !== nextHash || data.smsConfig.authToken !== undefined) {
          smsConfig.lastTestedAt = undefined;
          smsConfig.lastTestResult = undefined;
        }

        if (!smsConfig.enabled) {
          smsConfig.accountSid = undefined;
          smsConfig.authToken = undefined;
          smsConfig.fromNumber = undefined;
          smsConfig.lastTestedAt = undefined;
          smsConfig.lastTestResult = undefined;
        }

        notifications.smsConfig = smsConfig;
      }

      settings.updatedBy = userId as any;
      await settings.save();

      logger.info(`Communication settings updated for tenant: ${tenantId}`);

      return this.getCommunicationSettings(tenantId);
    } catch (error) {
      logger.error('Error updating communication settings:', error);
      throw error;
    }
  }

  async updatePaymentSettings(
    tenantId: string,
    userId: string,
    data: {
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
  ) {
    const settings = await this.ensureSettings(tenantId);
    const payments = settings.payments || (settings.payments = {} as any);
    const stripe = payments.stripe || (payments.stripe = {} as any);

    if (typeof data.allowCash === 'boolean') payments.allowCash = data.allowCash;
    if (typeof data.allowCard === 'boolean') payments.allowCard = data.allowCard;
    if (typeof data.allowBankTransfer === 'boolean')
      payments.allowBankTransfer = data.allowBankTransfer;
    if (typeof data.allowStoreCredit === 'boolean')
      payments.allowStoreCredit = data.allowStoreCredit;
    if (typeof data.requireSignature === 'boolean')
      payments.requireSignature = data.requireSignature;
    if (typeof data.autoCapture === 'boolean') payments.autoCapture = data.autoCapture;

    if (data.stripe) {
      const prevHash = JSON.stringify({
        enabled: stripe.enabled,
        publishableKey: stripe.publishableKey,
      });

      if (typeof data.stripe.enabled === 'boolean') {
        stripe.enabled = data.stripe.enabled;
      }
      if (data.stripe.publishableKey !== undefined) {
        stripe.publishableKey = data.stripe.publishableKey?.trim() || undefined;
      }
      if (data.stripe.secretKey !== undefined) {
        if (data.stripe.secretKey === null) {
          stripe.secretKey = undefined;
        } else if (data.stripe.secretKey.trim().length > 0) {
          stripe.secretKey = data.stripe.secretKey.trim();
        }
      }
      if (data.stripe.webhookSecret !== undefined) {
        if (data.stripe.webhookSecret === null) {
          stripe.webhookSecret = undefined;
        } else if (data.stripe.webhookSecret.trim().length > 0) {
          stripe.webhookSecret = data.stripe.webhookSecret.trim();
        }
      }

      const nextHash = JSON.stringify({
        enabled: stripe.enabled,
        publishableKey: stripe.publishableKey,
      });

      if (prevHash !== nextHash || data.stripe.secretKey !== undefined || data.stripe.webhookSecret !== undefined) {
        stripe.lastTestedAt = undefined;
        stripe.lastTestResult = undefined;
      }
    }

    if (!stripe.enabled) {
      stripe.publishableKey = undefined;
      stripe.secretKey = undefined;
      stripe.webhookSecret = undefined;
      stripe.lastTestedAt = undefined;
      stripe.lastTestResult = undefined;
    }

    settings.payments = payments;
    settings.updatedBy = userId as any;
    settings.markModified?.('payments');
    await settings.save();

    logger.info(`Payment settings updated for tenant: ${tenantId}`);

    return this.getPaymentSettings(tenantId);
  }

  async recordStripeTestResult(tenantId: string, userId: string, success: boolean) {
    const settings = await this.ensureSettings(tenantId);
    const payments = settings.payments || (settings.payments = {} as any);
    const stripe = payments.stripe || (payments.stripe = {} as any);

    stripe.lastTestedAt = new Date();
    stripe.lastTestResult = success ? 'success' : 'failure';
    settings.updatedBy = userId as any;
    settings.markModified?.('payments');
    await settings.save();
  }

  async updateIntegrationSettings(
    tenantId: string,
    userId: string,
    data: {
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
  ) {
    const settings = await this.ensureSettings(tenantId);
    const integrations = settings.integrations || (settings.integrations = {} as any);

    if (data.ecommerce?.shopify) {
      const shopify =
        integrations.ecommerce?.shopify ||
        ((integrations.ecommerce = integrations.ecommerce || {}), (integrations.ecommerce.shopify = integrations.ecommerce.shopify || {}));

      if (typeof data.ecommerce.shopify.enabled === 'boolean') {
        shopify.enabled = data.ecommerce.shopify.enabled;
      }
      if (data.ecommerce.shopify.storeDomain !== undefined) {
        shopify.storeDomain = data.ecommerce.shopify.storeDomain?.trim() || undefined;
      }
      if (data.ecommerce.shopify.accessToken !== undefined) {
        if (data.ecommerce.shopify.accessToken === null) {
          shopify.accessToken = undefined;
        } else if (data.ecommerce.shopify.accessToken.trim().length > 0) {
          shopify.accessToken = data.ecommerce.shopify.accessToken.trim();
        }
      }

      if (!shopify.enabled) {
        shopify.storeDomain = undefined;
        shopify.accessToken = undefined;
      }
    }

    if (data.accounting?.quickbooks) {
      const quickbooks =
        integrations.accounting?.quickbooks ||
        ((integrations.accounting = integrations.accounting || {}), (integrations.accounting.quickbooks = integrations.accounting.quickbooks || {}));

      if (typeof data.accounting.quickbooks.enabled === 'boolean') {
        quickbooks.enabled = data.accounting.quickbooks.enabled;
      }
      if (data.accounting.quickbooks.realmId !== undefined) {
        quickbooks.realmId = data.accounting.quickbooks.realmId?.trim() || undefined;
      }
      if (data.accounting.quickbooks.clientId !== undefined) {
        quickbooks.clientId = data.accounting.quickbooks.clientId?.trim() || undefined;
      }
      if (data.accounting.quickbooks.clientSecret !== undefined) {
        if (data.accounting.quickbooks.clientSecret === null) {
          quickbooks.clientSecret = undefined;
        } else if (data.accounting.quickbooks.clientSecret.trim().length > 0) {
          quickbooks.clientSecret = data.accounting.quickbooks.clientSecret.trim();
        }
      }

      if (!quickbooks.enabled) {
        quickbooks.realmId = undefined;
        quickbooks.clientId = undefined;
        quickbooks.clientSecret = undefined;
      }
    }

    if (data.crm?.hubspot) {
      const hubspot =
        integrations.crm?.hubspot ||
        ((integrations.crm = integrations.crm || {}), (integrations.crm.hubspot = integrations.crm.hubspot || {}));

      if (typeof data.crm.hubspot.enabled === 'boolean') {
        hubspot.enabled = data.crm.hubspot.enabled;
      }
      if (data.crm.hubspot.apiKey !== undefined) {
        if (data.crm.hubspot.apiKey === null) {
          hubspot.apiKey = undefined;
        } else if (data.crm.hubspot.apiKey.trim().length > 0) {
          hubspot.apiKey = data.crm.hubspot.apiKey.trim();
        }
      }

      if (!hubspot.enabled) {
        hubspot.apiKey = undefined;
      }
    }

    if (data.webhooks) {
      const webhooks =
        integrations.webhooks || (integrations.webhooks = {} as any);

      if (typeof data.webhooks.enabled === 'boolean') {
        webhooks.enabled = data.webhooks.enabled;
      }
      if (data.webhooks.url !== undefined) {
        webhooks.url = data.webhooks.url?.trim() || undefined;
      }
      if (data.webhooks.secret !== undefined) {
        if (data.webhooks.secret === null) {
          webhooks.secret = undefined;
        } else if (data.webhooks.secret.trim().length > 0) {
          webhooks.secret = data.webhooks.secret.trim();
        }
      }

      if (!webhooks.enabled) {
        webhooks.url = undefined;
        webhooks.secret = undefined;
        webhooks.lastTestedAt = undefined;
        webhooks.lastTestResult = undefined;
      }
    }

    settings.integrations = integrations;
    settings.updatedBy = userId as any;
    settings.markModified?.('integrations');
    await settings.save();

    logger.info(`Integration settings updated for tenant: ${tenantId}`);

    return this.getIntegrationSettings(tenantId);
  }

  async updateComplianceSettings(
    tenantId: string,
    userId: string,
    data: Partial<ISettings['compliance']>
  ) {
    const settings = await this.ensureSettings(tenantId);
    const compliance = settings.compliance || (settings.compliance = {} as any);

    if (typeof data.requireTwoFactor === 'boolean') {
      compliance.requireTwoFactor = data.requireTwoFactor;
    }
    if (typeof data.sessionTimeoutMinutes === 'number' && data.sessionTimeoutMinutes >= 0) {
      compliance.sessionTimeoutMinutes = data.sessionTimeoutMinutes;
    }
    if (typeof data.dataRetentionDays === 'number' && data.dataRetentionDays >= 0) {
      compliance.dataRetentionDays = data.dataRetentionDays;
    }
    if (typeof data.allowDataExport === 'boolean') {
      compliance.allowDataExport = data.allowDataExport;
    }
    if (typeof data.autoPurgeAuditLogs === 'boolean') {
      compliance.autoPurgeAuditLogs = data.autoPurgeAuditLogs;
    }
    if (Array.isArray(data.auditNotificationEmails)) {
      compliance.auditNotificationEmails = data.auditNotificationEmails
        .map((email) => email?.trim())
        .filter((email) => email);
    }

    settings.compliance = compliance;
    settings.updatedBy = userId as any;
    settings.markModified?.('compliance');
    await settings.save();

    logger.info(`Compliance settings updated for tenant: ${tenantId}`);

    return this.getComplianceSettings(tenantId);
  }
}
