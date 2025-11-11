import { getTenantConnection } from '../config/database';
import { SettingsSchema, ISettings } from '../models/settings.model';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export class SettingsService {
  private async getSettingsModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<ISettings>('Settings', SettingsSchema);
  }

  /**
   * Get or create settings
   */
  async getSettings(tenantId: string, storeName: string): Promise<ISettings> {
    try {
      const Settings = await this.getSettingsModel(tenantId);

      let settings = await Settings.findOne({ tenantId });

      if (!settings) {
        // Create default settings
        settings = new Settings({
          tenantId,
          store: {
            name: storeName,
          },
        });
        await settings.save();
        logger.info(`Default settings created for tenant: ${tenantId}`);
      }

      return settings;
    } catch (error) {
      logger.error('Error getting settings:', error);
      throw error;
    }
  }

  /**
   * Update store settings
   */
  async updateStoreSettings(
    tenantId: string,
    userId: string,
    data: Partial<ISettings['store']>
  ): Promise<ISettings> {
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
      return settings;
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
  ): Promise<ISettings> {
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
      return settings;
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
  ): Promise<ISettings> {
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
      return settings;
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
  ): Promise<ISettings> {
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
      return settings;
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
  ): Promise<ISettings> {
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
      return settings;
    } catch (error) {
      logger.error('Error updating POS settings:', error);
      throw error;
    }
  }
}
