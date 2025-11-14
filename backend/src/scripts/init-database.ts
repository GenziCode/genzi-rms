import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { TenantSchema } from '../models/tenant.model';
import { UserSchema } from '../models/user.model';
import { CategorySchema } from '../models/category.model';
import { StoreSchema } from '../models/store.model';
import { ProductSchema } from '../models/product.model';
import { UserRole, SubscriptionPlan, SubscriptionStatus, TenantStatus } from '../types';

// Load environment variables
dotenv.config();

/**
 * Initialize Master Database
 * Creates collections and indexes for tenants and users
 */
async function initMasterDatabase() {
  const uri = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/genzi_master';
  
  logger.info('Initializing Master Database...');
  logger.info(`URI: ${uri}`);

  const connection = await mongoose.createConnection(uri, {
    directConnection: true,
  });

  logger.info('✅ Connected to master database');

  // Create models (this creates collections)
  const Tenant = connection.model('Tenant', TenantSchema);
  const User = connection.model('User', UserSchema);

  // Create indexes
  logger.info('Creating indexes...');
  await Tenant.createIndexes();
  await User.createIndexes();
  
  logger.info('✅ Master database initialized');
  logger.info('Collections created:');
  const collections = await connection.db.listCollections().toArray();
  collections.forEach(col => {
    logger.info(`  - ${col.name}`);
  });

  await connection.close();
}

/**
 * Initialize Sample Tenant Database
 * Creates a sample tenant with collections
 */
async function initSampleTenantDatabase() {
  const baseUri = process.env.TENANT_DB_BASE_URI || 'mongodb://localhost:27017';
  const dbName = 'tenant_sample_demo';
  const uri = `${baseUri}/${dbName}`;
  
  logger.info('Initializing Sample Tenant Database...');
  logger.info(`URI: ${uri}`);

  const connection = await mongoose.createConnection(uri, {
    directConnection: true,
  });

  logger.info('✅ Connected to tenant database');

  // Create models
  const Category = connection.model('Category', CategorySchema);
  const Store = connection.model('Store', StoreSchema);
  const Product = connection.model('Product', ProductSchema);

  // Create indexes
  logger.info('Creating indexes...');
  await Category.createIndexes();
  await Store.createIndexes();
  await Product.createIndexes();

  // Seed default categories
  logger.info('Seeding default categories...');
  const categories = [
    { name: 'Beverages', slug: 'beverages', sortOrder: 1, isActive: true },
    { name: 'Food', slug: 'food', sortOrder: 2, isActive: true },
    { name: 'Desserts', slug: 'desserts', sortOrder: 3, isActive: true },
    { name: 'Others', slug: 'others', sortOrder: 4, isActive: true },
  ];

  for (const cat of categories) {
    await Category.findOneAndUpdate(
      { slug: cat.slug },
      cat,
      { upsert: true, new: true }
    );
    logger.info(`  ✅ Category: ${cat.name}`);
  }

  // Seed default store
  logger.info('Seeding default store...');
  await Store.findOneAndUpdate(
    { code: 'MAIN' },
    {
      name: 'Main Store',
      code: 'MAIN',
      isActive: true,
      isDefault: true,
      settings: {
        timezone: 'America/New_York',
        currency: 'USD',
        taxRate: 0,
      },
    },
    { upsert: true, new: true }
  );
  logger.info('  ✅ Store: Main Store');

  logger.info('✅ Sample tenant database initialized');
  logger.info('Collections created:');
  const collections = await connection.db.listCollections().toArray();
  collections.forEach(col => {
    logger.info(`  - ${col.name}`);
  });

  await connection.close();
}

/**
 * Create Sample Tenant Record in Master Database
 * Creates a tenant record that matches the sample tenant database
 */
async function createSampleTenantRecord() {
  const uri = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/genzi_master';
  const dbName = 'tenant_sample_demo';

  logger.info('Creating sample tenant record in master database...');

  const connection = await mongoose.createConnection(uri, {
    directConnection: true,
  });

  logger.info('✅ Connected to master database');

  // Create models
  const Tenant = connection.model('Tenant', TenantSchema);
  const User = connection.model('User', UserSchema);

  // Check if tenant already exists
  const existingTenant = await Tenant.findOne({ subdomain: 'demo' });
  if (existingTenant) {
    logger.info('✅ Sample tenant record already exists');
    await connection.close();
    return;
  }

  // Create trial dates
  const trialStartDate = new Date();
  const trialEndDate = new Date(trialStartDate.getTime());
  trialEndDate.setDate(trialEndDate.getDate() + 14);

  // Create sample tenant
  const tenant = await Tenant.create({
    name: 'Demo Restaurant',
    slug: 'demo-restaurant',
    subdomain: 'demo',
    dbName,
    owner: {
      name: 'Demo Owner',
      email: 'demo@genzi.com',
      phone: '+1-555-0123',
    },
    subscription: {
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.TRIAL,
      trialStartDate,
      trialEndDate,
      billingCycle: 'monthly',
    },
    status: TenantStatus.ACTIVE,
    limits: {
      users: 5,
      stores: 1,
      products: 1000,
      monthlyTransactions: 5000,
      storageBytes: 1073741824, // 1GB
    },
    usage: {
      users: 1,
      stores: 1,
      products: 0,
      monthlyTransactions: 0,
      storageBytes: 0,
    },
    features: {
      multiStore: false,
      restaurant: true,
      inventory: true,
      loyalty: false,
      reporting: true,
      api: false,
      webhooks: false,
    },
    settings: {
      timezone: 'America/New_York',
      currency: 'USD',
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    },
  });

  logger.info(`✅ Tenant record created: ${tenant.subdomain} (${tenant.dbName})`);

  // Create sample user
  const user = await User.create({
    tenantId: tenant._id,
    email: 'demo@genzi.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: "demo123"
    firstName: 'Demo',
    lastName: 'Owner',
    role: UserRole.OWNER,
    permissions: ['*'],
    emailVerified: true,
    status: 'active',
  });

  logger.info(`✅ User created: ${user.email}`);

  await connection.close();
}

/**
 * Main function
 */
async function main() {
  try {
    logger.info('🚀 Starting Database Initialization...');
    logger.info('');

    // Initialize master database
    await initMasterDatabase();
    logger.info('');

    // Initialize sample tenant database
    await initSampleTenantDatabase();
    logger.info('');

    // Create sample tenant record in master database
    await createSampleTenantRecord();
    logger.info('');

    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('✅ DATABASE INITIALIZATION COMPLETE!');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('');
    logger.info('Databases created:');
    logger.info('  1. genzi_master (or genzi-rms) - Master database');
    logger.info('  2. tenant_sample_demo - Sample tenant database');
    logger.info('');
    logger.info('Sample tenant created:');
    logger.info('  - Subdomain: demo');
    logger.info('  - Email: demo@genzi.com');
    logger.info('  - Password: demo123');
    logger.info('');
    logger.info('You can now:');
    logger.info('  - Start the server: npm run dev');
    logger.info('  - Access frontend at: http://localhost:3000');
    logger.info('  - Login with demo@genzi.com / demo123');
    logger.info('  - Register tenants via API');
    logger.info('  - View databases in MongoDB Compass');
    logger.info('');

    process.exit(0);
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    logger.error('');
    logger.error('Please ensure:');
    logger.error('  1. MongoDB is running');
    logger.error('  2. MongoDB is accessible at the configured URI');
    logger.error('  3. You have permission to create databases');
    process.exit(1);
  }
}

main();

