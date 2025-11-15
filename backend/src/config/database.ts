import mongoose, { Connection } from 'mongoose';
import { logger } from '../utils/logger';
import { CustomerSchema } from '../models/customer.model';
import { UserSchema } from '../models/user.model';
import { SyncDeviceSchema } from '../models/syncDevice.model';
import { CategorySchema } from '../models/category.model';
import { ProductSchema } from '../models/product.model';
import { StoreSchema } from '../models/store.model';
import { VendorSchema } from '../models/vendor.model';

// Connection cache for tenant databases
const connections = new Map<string, Connection>();

/**
 * Get or create Master database connection
 * Master DB stores tenant metadata, users, subscriptions
 */
export const getMasterConnection = async (): Promise<Connection> => {
  const cacheKey = 'master';

  if (connections.has(cacheKey)) {
    return connections.get(cacheKey)!;
  }

  try {
    const uri = process.env.MASTER_DB_URI || 'mongodb://localhost:27017/genzi_master';

    logger.info(`Connecting to Master database at: ${uri}`);

    const connection = mongoose.createConnection(uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000, // Increased timeout
      directConnection: true, // Connect directly (good for local dev)
    });

    // Wait for connection to be established
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('MongoDB connection timeout after 10 seconds'));
      }, 10000);

      connection.once('connected', () => {
        clearTimeout(timeout);
        logger.info('✅ Master database connected successfully');
        resolve();
      });

      connection.once('error', (err) => {
        clearTimeout(timeout);
        logger.error('Master database connection error:', err);
        reject(err);
      });
    });

    connection.on('disconnected', () => {
      logger.warn('Master database disconnected');
    });

    connections.set(cacheKey, connection);

    return connection;
  } catch (error) {
    logger.error('Failed to connect to Master database:', error);
    logger.error('Please ensure MongoDB is running on localhost:27017');
    logger.error('Connection URI:', process.env.MASTER_DB_URI);
    throw error;
  }
};

const registerBaseTenantModels = (connection: Connection) => {
  const baseModels: Array<{ name: string; schema: mongoose.Schema }> = [
    { name: 'Customer', schema: CustomerSchema },
    { name: 'User', schema: UserSchema },
    { name: 'SyncDevice', schema: SyncDeviceSchema },
    { name: 'Category', schema: CategorySchema },
    { name: 'Product', schema: ProductSchema },
    { name: 'Store', schema: StoreSchema },
    { name: 'Vendor', schema: VendorSchema },
  ];

  baseModels.forEach(({ name, schema }) => {
    if (!connection.models[name]) {
      connection.model(name, schema);
    }
  });
};

/**
 * Get or create Tenant database connection
 * Each tenant has their own database for data isolation
 */
export const getTenantConnection = async (
  tenantId: string,
  dbName?: string
): Promise<Connection> => {
  if (connections.has(tenantId)) {
    const existing = connections.get(tenantId)!;
    registerBaseTenantModels(existing);
    return existing;
  }

  try {
    if (!dbName) {
      throw new Error('Tenant database name is required to establish new connection');
    }
    const baseUri = process.env.TENANT_DB_BASE_URI || 'mongodb://localhost:27017';
    const uri = `${baseUri}/${dbName}`;

    logger.info(`Connecting to tenant database: ${dbName}`);

    const connection = await mongoose.createConnection(uri, {
      maxPoolSize: 10,
      minPoolSize: 1,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
    });

    connection.on('connected', () => {
      logger.info(`Tenant database connected: ${dbName}`);
    });

    connection.on('error', (err) => {
      logger.error(`Tenant database error (${dbName}):`, err);
    });

    registerBaseTenantModels(connection);

    connections.set(tenantId, connection);

    return connection;
  } catch (error) {
    logger.error(`Failed to connect to tenant database (${dbName}):`, error);
    throw error;
  }
};

/**
 * Get model from tenant connection
 */
export const getTenantModel = <T>(
  connection: Connection,
  modelName: string,
  schema: mongoose.Schema
): mongoose.Model<T> => {
  // Check if model already exists in this connection
  if (connection.models[modelName]) {
    return connection.models[modelName] as mongoose.Model<T>;
  }

  return connection.model<T>(modelName, schema);
};

/**
 * Initialize tenant database with default collections and data
 */
export const initializeTenantDatabase = async (
  connection: Connection,
  tenantId?: string
): Promise<void> => {
  try {
    logger.info(`Initializing tenant database: ${connection.name}`);

    // Create models
    const Category = connection.model('Category', CategorySchema);
    const Store = connection.model('Store', StoreSchema);

    // Create default categories
    const defaultCategories = [
      { name: 'Beverages', slug: 'beverages', sortOrder: 1, isActive: true },
      { name: 'Food', slug: 'food', sortOrder: 2, isActive: true },
      { name: 'Others', slug: 'others', sortOrder: 3, isActive: true },
    ];

    for (const cat of defaultCategories) {
      await Category.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true, new: true });
    }

    // Create default store only if tenantId is provided
    // Note: Stores should be created via seedTenantSampleData with proper tenantId
    // This is kept for backward compatibility but should not be used for new tenants
    if (tenantId) {
      const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
      const existingStore = await Store.findOne({ tenantId: tenantObjectId, isDefault: true });
      if (!existingStore) {
        await Store.create({
          tenantId: tenantObjectId,
          name: 'Main Store',
          code: 'MAIN',
          isActive: true,
          isDefault: true,
          settings: {
            timezone: 'America/New_York',
            currency: 'USD',
            taxRate: 0,
          },
        });
      }
    }

    logger.info(`Tenant database initialized successfully: ${connection.name}`);
  } catch (error) {
    logger.error('Failed to initialize tenant database:', error);
    throw error;
  }
};

/**
 * Close all database connections
 */
export const closeAllConnections = async (): Promise<void> => {
  logger.info('Closing all database connections...');

  for (const [key, connection] of connections.entries()) {
    await connection.close();
    logger.info(`Closed connection: ${key}`);
  }

  connections.clear();
  logger.info('All database connections closed');
};

/**
 * Health check for databases
 */
export const checkDatabaseHealth = async (): Promise<{
  master: boolean;
  tenants: number;
}> => {
  try {
    const masterConn = await getMasterConnection();
    const masterHealth = masterConn.readyState === 1;

    const tenantCount = Array.from(connections.values()).filter(
      (conn) => conn.readyState === 1 && conn.name !== 'genzi_master'
    ).length;

    return {
      master: masterHealth,
      tenants: tenantCount,
    };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      master: false,
      tenants: 0,
    };
  }
};
