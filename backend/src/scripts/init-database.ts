import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { TenantSchema } from '../models/tenant.model';
import { UserSchema } from '../models/user.model';
import { CategorySchema } from '../models/category.model';
import { StoreSchema } from '../models/store.model';
import { ProductSchema } from '../models/product.model';

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

    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('✅ DATABASE INITIALIZATION COMPLETE!');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('');
    logger.info('Databases created:');
    logger.info('  1. genzi_master (or genzi-rms) - Master database');
    logger.info('  2. tenant_sample_demo - Sample tenant database');
    logger.info('');
    logger.info('You can now:');
    logger.info('  - Start the server: npm run dev');
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

