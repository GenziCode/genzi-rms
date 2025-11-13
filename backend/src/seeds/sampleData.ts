import { Connection, Types } from 'mongoose';
import { logger } from '../utils/logger';
import { CategorySchema } from '../models/category.model';
import { StoreSchema } from '../models/store.model';
import { ProductSchema } from '../models/product.model';
import { VendorSchema } from '../models/vendor.model';
import { CustomerSchema } from '../models/customer.model';

type CategoryFixture = {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder: number;
};

type StoreFixture = {
  name: string;
  code: string;
  isDefault?: boolean;
  isActive?: boolean;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  phone?: string;
  email?: string;
  settings?: {
    timezone?: string;
    taxRate?: number;
    currency?: string;
  };
};

type ProductFixture = {
  name: string;
  sku: string;
  barcode?: string;
  categorySlug: string;
  description?: string;
  price: number;
  cost: number;
  taxRate?: number;
  stock: number;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  tags?: string[];
  trackInventory?: boolean;
  allowNegativeStock?: boolean;
};

type VendorFixture = {
  name: string;
  company: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  country?: string;
  paymentTerms?: string;
  creditLimit?: number;
  creditDays?: number;
  notes?: string;
  tags?: string[];
};

type CustomerFixture = {
  name: string;
  email?: string;
  phone: string;
  address?: string;
  loyaltyPoints?: number;
  totalPurchases?: number;
  totalSpent?: number;
  tags?: string[];
  notes?: string;
};

const categoryFixtures: CategoryFixture[] = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Consumer electronics and accessories',
    color: '#4f46e5',
    icon: 'cpu',
    sortOrder: 10,
  },
  {
    name: 'Groceries',
    slug: 'groceries',
    description: 'Everyday essentials and fresh produce',
    color: '#16a34a',
    icon: 'shopping-basket',
    sortOrder: 20,
  },
  {
    name: 'Home & Living',
    slug: 'home-living',
    description: 'Home decor, kitchenware, and lifestyle',
    color: '#f97316',
    icon: 'sofa',
    sortOrder: 30,
  },
];

const storeFixtures: StoreFixture[] = [
  {
    name: 'Downtown Flagship',
    code: 'DTN',
    isActive: true,
    address: {
      street: '100 Market Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    },
    phone: '+1-555-3100',
    email: 'downtown@demo-retail.com',
    contact: {
      phone: '+1-555-3100',
      email: 'downtown@demo-retail.com',
      website: 'https://demo-retail.com',
    },
    businessDetails: {
      taxId: 'TX-10001',
    },
    timezone: 'America/New_York',
    currency: 'USD',
    settings: {
      timezone: 'America/New_York',
      currency: 'USD',
      taxRate: 8.25,
    },
  },
  {
    name: 'Warehouse & Fulfillment',
    code: 'WH1',
    isActive: true,
    address: {
      street: '245 Logistics Blvd',
      city: 'Jersey City',
      state: 'NJ',
      zipCode: '07302',
      country: 'USA',
    },
    phone: '+1-555-3200',
    email: 'warehouse@demo-retail.com',
    contact: {
      phone: '+1-555-3200',
      email: 'warehouse@demo-retail.com',
    },
    businessDetails: {
      taxId: 'TX-10002',
    },
    timezone: 'America/New_York',
    currency: 'USD',
    settings: {
      timezone: 'America/New_York',
      currency: 'USD',
      taxRate: 0,
    },
  },
];

const productFixtures: ProductFixture[] = [
  {
    name: 'Wireless Noise-Canceling Headphones',
    sku: 'ELEC-1001',
    barcode: '8901234567890',
    categorySlug: 'electronics',
    description: 'Bluetooth over-ear headphones with 30 hours battery life.',
    price: 159.99,
    cost: 84.5,
    taxRate: 8.25,
    stock: 36,
    minStock: 6,
    maxStock: 120,
    reorderPoint: 10,
    tags: ['audio', 'bluetooth', 'premium'],
  },
  {
    name: 'Organic Cold Brew Coffee (12oz)',
    sku: 'GROC-2003',
    barcode: '8909876543210',
    categorySlug: 'groceries',
    description: 'Ready-to-drink cold brew coffee sourced from single-origin beans.',
    price: 5.99,
    cost: 2.1,
    taxRate: 0,
    stock: 180,
    minStock: 40,
    maxStock: 400,
    reorderPoint: 60,
    tags: ['beverage', 'organic', 'coffee'],
  },
  {
    name: 'Smart LED Desk Lamp',
    sku: 'HOME-4105',
    barcode: '8912345678901',
    categorySlug: 'home-living',
    description: 'Adjustable LED desk lamp with wireless charging pad and smart scheduling.',
    price: 69.5,
    cost: 32.75,
    taxRate: 8.25,
    stock: 58,
    minStock: 8,
    maxStock: 150,
    reorderPoint: 20,
    tags: ['lighting', 'smart-home'],
  },
];

const vendorFixtures: VendorFixture[] = [
  {
    name: 'Acme Distribution',
    company: 'Acme Distribution Co.',
    email: 'sales@acmedist.com',
    phone: '+1-555-4100',
    address: '500 Industrial Way, Jersey City, NJ 07305',
    city: 'Jersey City',
    country: 'USA',
    paymentTerms: 'Net 30',
    creditLimit: 25000,
    creditDays: 30,
    notes: 'Primary electronics and accessories supplier.',
    tags: ['electronics', 'priority'],
  },
  {
    name: 'Green Fields Produce',
    company: 'Green Fields Supply',
    email: 'orders@greenfields.com',
    phone: '+1-555-4200',
    address: '301 Farm Road, Princeton, NJ 08540',
    city: 'Princeton',
    country: 'USA',
    paymentTerms: 'Net 21',
    creditLimit: 10000,
    creditDays: 21,
    notes: 'Organic produce supplier, delivers twice weekly.',
    tags: ['organic', 'perishables'],
  },
];

const customerFixtures: CustomerFixture[] = [
  {
    name: 'Alicia Owens',
    email: 'alicia.owens@example.com',
    phone: '+1-555-5100',
    address: '123 Park Avenue, New York, NY 10017',
    loyaltyPoints: 140,
    totalPurchases: 6,
    totalSpent: 980,
    tags: ['vip', 'email-subscriber'],
  },
  {
    name: 'Marcus Lin',
    email: 'marcus.lin@example.com',
    phone: '+1-555-5200',
    address: '885 Ocean Avenue, Jersey City, NJ 07305',
    loyaltyPoints: 45,
    totalPurchases: 3,
    totalSpent: 240,
    tags: ['newsletter'],
  },
  {
    name: 'Sofia Rivera',
    email: 'sofia.rivera@example.com',
    phone: '+1-555-5300',
    address: '77 Grand Street, Brooklyn, NY 11249',
    loyaltyPoints: 320,
    totalPurchases: 12,
    totalSpent: 1875,
    tags: ['vip', 'sms-opt-in'],
    notes: 'Prefers curbside pickup on weekdays.',
  },
];

interface SeedOptions {
  tenantId: string;
  userId: string;
}

export const seedTenantSampleData = async (
  connection: Connection,
  options: SeedOptions
): Promise<void> => {
  try {
    const Category = connection.model('Category', CategorySchema);
    const Store = connection.model('Store', StoreSchema);
    const Product = connection.model('Product', ProductSchema);
    const Vendor = connection.model('Vendor', VendorSchema);
    const Customer = connection.model('Customer', CustomerSchema);

    const tenantObjectId = new Types.ObjectId(options.tenantId);
    const userObjectId = new Types.ObjectId(options.userId);

    // Categories
    const categoryIdMap = new Map<string, Types.ObjectId>();
    for (const category of categoryFixtures) {
      const existing = await Category.findOne({ slug: category.slug });
      if (existing) {
        categoryIdMap.set(category.slug, existing._id);
        continue;
      }

      const created = await Category.create({
        ...category,
        isActive: true,
      });
      categoryIdMap.set(category.slug, created._id);
    }

    // Stores
    for (const store of storeFixtures) {
      const existing = await Store.findOne({
        tenantId: tenantObjectId,
        code: store.code,
      });
      if (existing) continue;

      await Store.create({
        tenantId: tenantObjectId,
        name: store.name,
        code: store.code,
        address: store.address,
        phone: store.phone,
        email: store.email,
        contact: store.contact,
        businessDetails: store.businessDetails,
        timezone: store.timezone,
        currency: store.currency,
        settings: store.settings,
        isActive: store.isActive ?? true,
        isDefault: store.isDefault ?? false,
      });
    }

    // Products
    for (const product of productFixtures) {
      const exists = await Product.findOne({ sku: product.sku });
      if (exists) continue;

      const categoryId = categoryIdMap.get(product.categorySlug);
      if (!categoryId) {
        logger.warn(
          `[seed] Skipping product "${product.name}" because category "${product.categorySlug}" was not found`
        );
        continue;
      }

      await Product.create({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        category: categoryId,
        description: product.description,
        price: product.price,
        cost: product.cost,
        taxRate: product.taxRate ?? 0,
        stock: product.stock,
        minStock: product.minStock,
        maxStock: product.maxStock,
        reorderPoint: product.reorderPoint,
        tags: product.tags,
        trackInventory: product.trackInventory ?? true,
        allowNegativeStock: product.allowNegativeStock ?? false,
        isActive: true,
        createdBy: userObjectId,
        metadata: {
          seeded: true,
        },
      });
    }

    // Vendors
    for (const vendor of vendorFixtures) {
      const existing = await Vendor.findOne({
        tenantId: tenantObjectId,
        company: vendor.company,
      });
      if (existing) continue;

      await Vendor.create({
        tenantId: tenantObjectId,
        name: vendor.name,
        company: vendor.company,
        email: vendor.email,
        phone: vendor.phone,
        address: vendor.address,
        city: vendor.city,
        country: vendor.country ?? 'USA',
        paymentTerms: vendor.paymentTerms ?? 'Net 30',
        creditLimit: vendor.creditLimit ?? 0,
        creditDays: vendor.creditDays ?? 30,
        notes: vendor.notes,
        tags: vendor.tags,
        totalPurchased: 0,
        currentBalance: 0,
        totalPurchaseOrders: 0,
        averageDeliveryTime: 0,
        isActive: true,
        createdBy: userObjectId,
      });
    }

    // Customers
    for (const customer of customerFixtures) {
      const existing = await Customer.findOne({
        tenantId: tenantObjectId,
        phone: customer.phone,
      });
      if (existing) continue;

      await Customer.create({
        tenantId: tenantObjectId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        loyaltyPoints: customer.loyaltyPoints ?? 0,
        totalPurchases: customer.totalPurchases ?? 0,
        totalSpent: customer.totalSpent ?? 0,
        creditLimit: 0,
        creditBalance: 0,
        notes: customer.notes,
        tags: customer.tags,
        isActive: true,
        createdBy: userObjectId,
      });
    }

    logger.info('[seed] Tenant sample data applied successfully');
  } catch (error) {
    logger.error('[seed] Failed to apply tenant sample data:', error);
  }
};
