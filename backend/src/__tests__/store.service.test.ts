import { storeService } from '../services/store.service';

jest.mock('../config/database', () => ({
  getTenantConnection: jest.fn(),
}));

type StoreDoc = {
  _id: string;
  tenantId: string;
  name: string;
  code: string;
  address?: Record<string, any>;
  phone?: string;
  email?: string;
  contact?: Record<string, any>;
  businessDetails?: Record<string, any>;
  timezone?: string;
  currency?: string;
  isActive: boolean;
  isDefault: boolean;
  settings?: Record<string, any>;
  toObject: () => any;
  save: () => Promise<void>;
};

const mockStores: StoreDoc[] = [];

const buildStoreModel = () => {
  const findOne = jest.fn(async (query) => {
    if (query._id) {
      return mockStores.find(
        (store) => store._id === query._id && store.tenantId === query.tenantId
      ) ?? null;
    }
    if (query.code) {
      return mockStores.find(
        (store) =>
          store.code === query.code && store.tenantId === query.tenantId
      ) ?? null;
    }
    return null;
  });

  return {
    find: jest.fn(async (query) =>
      mockStores
        .filter((store) => store.tenantId === query.tenantId)
        .map((store) => ({ ...store }))
    ),
    findOne,
    findOneAndUpdate: jest.fn(async () => null),
    countDocuments: jest.fn(async (query) =>
      mockStores.filter((store) => store.tenantId === query.tenantId).length
    ),
    exists: jest.fn(async (query) =>
      mockStores.some(
        (store) =>
          store.tenantId === query.tenantId && store.isDefault === query.isDefault
      )
    ),
    create: jest.fn(async (payload) => {
      const doc: StoreDoc = {
        _id: (Math.random().toString(16).slice(2) + Date.now().toString(16)).slice(0, 24).padEnd(24, '0'),
        tenantId: payload.tenantId,
        name: payload.name,
        code: payload.code,
        address: payload.address,
        phone: payload.phone,
        email: payload.email,
        contact: payload.contact,
        businessDetails: payload.businessDetails,
        timezone: payload.timezone,
        currency: payload.currency,
        isActive: payload.isActive ?? true,
        isDefault: payload.isDefault ?? false,
        settings: payload.settings,
        toObject() {
          return { ...this };
        },
        async save() {},
      };
      mockStores.push(doc);
      return doc;
    }),
    updateMany: jest.fn(async (query, update) => {
      const excludeId = query._id?.$ne;
      mockStores.forEach((store) => {
        if (
          store.tenantId === query.tenantId &&
          (!excludeId || store._id !== excludeId)
        ) {
          if (update.$set?.isDefault === false) {
            store.isDefault = false;
          }
        }
      });
    }),
    updateOne: jest.fn(async (query, update) => {
      const store = mockStores.find(
        (s) => s._id === query._id && s.tenantId === query.tenantId
      );
      if (store && update.$set?.isDefault !== undefined) {
        store.isDefault = update.$set.isDefault;
      }
    }),
    deleteOne: jest.fn(async (query) => {
      const index = mockStores.findIndex(
        (store) =>
          store._id === query._id && store.tenantId === query.tenantId
      );
      if (index >= 0) {
        mockStores.splice(index, 1);
      }
    }),
  };
};

const { getTenantConnection } = require('../config/database');

describe('StoreService', () => {
  beforeEach(() => {
    mockStores.length = 0;
    const model = buildStoreModel();
    getTenantConnection.mockResolvedValue({
      model: () => model,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates the first store as default', async () => {
    const store = await storeService.create('tenant-1', {
      name: 'Main Store',
      code: 'MAIN',
    });

    expect(store.isDefault).toBe(true);
    expect(mockStores).toHaveLength(1);
    expect(mockStores[0].isDefault).toBe(true);
    expect(mockStores[0].timezone).toBe('America/New_York');
    expect(mockStores[0].currency).toBe('USD');
  });

  it('ensures only one default store after creation', async () => {
    await storeService.create('tenant-1', { name: 'Main', code: 'MAIN' });
    const second = await storeService.create('tenant-1', {
      name: 'Branch',
      code: 'BR001',
      isDefault: true,
    });

    expect(second.isDefault).toBe(true);
    const defaults = mockStores.filter((store) => store.isDefault);
    expect(defaults).toHaveLength(1);
  });
});


