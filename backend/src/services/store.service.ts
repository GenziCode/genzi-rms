import { getTenantConnection } from '../config/database';
import { StoreSchema, IStore } from '../models/store.model';
import { AppError, ConflictError, NotFoundError } from '../utils/appError';
import { logger } from '../utils/logger';

interface StorePayload {
  name: string;
  code: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  phone?: string;
  email?: string;
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  businessDetails?: {
    registrationNumber?: string;
    taxId?: string;
    businessType?: string;
  };
  timezone?: string;
  currency?: string;
  manager?: string;
  settings?: {
    timezone?: string;
    taxRate?: number;
    currency?: string;
  };
  isActive?: boolean;
  isDefault?: boolean;
}

export class StoreService {
  private async getStoreModel(tenantId: string) {
    const connection = await getTenantConnection(tenantId);
    return connection.model<IStore>('Store', StoreSchema);
  }

  async list(tenantId: string): Promise<IStore[]> {
    const Store = await this.getStoreModel(tenantId);
    return Store.find({ tenantId }).sort({ isDefault: -1, name: 1 }).lean();
  }

  async getById(tenantId: string, storeId: string): Promise<IStore> {
    const Store = await this.getStoreModel(tenantId);
    const store = await Store.findOne({ tenantId, _id: storeId }).lean();
    if (!store) {
      throw new NotFoundError('Store');
    }
    return store;
  }

  async create(tenantId: string, data: StorePayload): Promise<IStore> {
    const Store = await this.getStoreModel(tenantId);

    const existingCode = await Store.findOne({
      tenantId,
      code: data.code.toUpperCase(),
    });
    if (existingCode) {
      throw new ConflictError('A store with this code already exists');
    }

    const isFirstStore = (await Store.countDocuments({ tenantId })) === 0;
    const store = await Store.create({
      tenantId,
      name: data.name,
      code: data.code.toUpperCase(),
      address: data.address,
      phone: data.phone ?? data.contact?.phone,
      email: data.email ?? data.contact?.email,
      contact: data.contact,
      businessDetails: data.businessDetails,
      timezone: data.timezone ?? data.settings?.timezone ?? 'America/New_York',
      currency: data.currency ?? data.settings?.currency ?? 'USD',
      manager: data.manager,
      settings: {
        timezone: data.settings?.timezone ?? data.timezone,
        currency: data.settings?.currency ?? data.currency,
        taxRate: data.settings?.taxRate,
      },
      isActive: data.isActive ?? true,
      isDefault: data.isDefault ?? isFirstStore,
    });

    if (store.isDefault) {
      await Store.updateMany(
        { tenantId, _id: { $ne: store._id } },
        { $set: { isDefault: false } }
      );
    }

    logger.info(`Store created for tenant ${tenantId}: ${store.code}`);
    return store.toObject();
  }

  async update(tenantId: string, storeId: string, data: Partial<StorePayload>): Promise<IStore> {
    const Store = await this.getStoreModel(tenantId);
    const store = await Store.findOne({ tenantId, _id: storeId });
    if (!store) {
      throw new NotFoundError('Store');
    }

    if (data.code && data.code.toUpperCase() !== store.code) {
      const codeExists = await Store.findOne({
        tenantId,
        code: data.code.toUpperCase(),
        _id: { $ne: storeId },
      });
      if (codeExists) {
        throw new ConflictError('A store with this code already exists');
      }
      store.code = data.code.toUpperCase();
    }

    if (data.name !== undefined) store.name = data.name;
    if (data.address !== undefined) store.address = data.address;
    if (data.phone !== undefined) store.phone = data.phone;
    if (data.email !== undefined) store.email = data.email;
    if (data.contact !== undefined) store.contact = data.contact as any;
    if (data.businessDetails !== undefined) store.businessDetails = data.businessDetails as any;
    if (data.timezone !== undefined) store.timezone = data.timezone;
    if (data.currency !== undefined) store.currency = data.currency;
    if (data.manager !== undefined) store.manager = data.manager as any;

    const mergedSettings: Record<string, any> = {
      ...(store.settings?.toObject?.() ?? store.settings ?? {}),
    };
    let settingsChanged = false;

    if (data.settings) {
      Object.assign(mergedSettings, data.settings);
      settingsChanged = true;
    }
    if (data.timezone !== undefined) {
      mergedSettings.timezone = data.timezone;
      settingsChanged = true;
    }
    if (data.currency !== undefined) {
      mergedSettings.currency = data.currency;
      settingsChanged = true;
    }
    if (settingsChanged) {
      store.settings = mergedSettings;
      if (mergedSettings.timezone !== undefined) {
        store.timezone = mergedSettings.timezone;
      }
      if (mergedSettings.currency !== undefined) {
        store.currency = mergedSettings.currency;
      }
    }
    if (typeof data.isActive === 'boolean') {
      store.isActive = data.isActive;
    }

    if (typeof data.isDefault === 'boolean') {
      store.isDefault = data.isDefault;
    }

    await store.save();

    if (store.isDefault) {
      await Store.updateMany(
        { tenantId, _id: { $ne: store._id } },
        { $set: { isDefault: false } }
      );
    } else {
      const defaultExists = await Store.exists({ tenantId, isDefault: true });
      if (!defaultExists) {
        await Store.updateOne({ _id: store._id }, { $set: { isDefault: true } });
        store.isDefault = true;
      }
    }

    logger.info(`Store ${storeId} updated for tenant ${tenantId}`);
    return store.toObject();
  }

  async delete(tenantId: string, storeId: string): Promise<void> {
    const Store = await this.getStoreModel(tenantId);
    const store = await Store.findOne({ tenantId, _id: storeId });
    if (!store) {
      throw new NotFoundError('Store');
    }

    const count = await Store.countDocuments({ tenantId });
    if (count <= 1) {
      throw new AppError('Cannot delete the only store', 400);
    }

    if (store.isDefault) {
      throw new AppError('Cannot delete the default store. Set another store as default first.', 400);
    }

    await Store.deleteOne({ _id: storeId, tenantId });
    logger.info(`Store ${storeId} deleted for tenant ${tenantId}`);
  }
}

export const storeService = new StoreService();


