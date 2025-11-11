import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

let redisClient: RedisClientType | null = null;

/**
 * Initialize Redis connection (Optional)
 */
export const initRedis = async (): Promise<RedisClientType | null> => {
  if (redisClient) {
    return redisClient;
  }

  // Redis is optional - skip if not configured or not running
  if (!process.env.REDIS_URL || process.env.REDIS_URL === 'skip') {
    logger.warn('Redis not configured - skipping Redis connection');
    return null;
  }

  try {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';

    logger.info('Connecting to Redis...');

    redisClient = createClient({
      url,
      password: process.env.REDIS_PASSWORD,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: false, // Don't auto-reconnect on failure
      },
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    redisClient.on('end', () => {
      logger.warn('Redis client disconnected');
    });

    await redisClient.connect();

    logger.info('✅ Redis connected successfully');
    return redisClient;
  } catch (error) {
    logger.warn('Failed to connect to Redis (will continue without caching):', error);
    redisClient = null;
    return null; // Continue without Redis
  }
};

/**
 * Get Redis client instance
 */
export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initRedis() first.');
  }
  return redisClient;
};

/**
 * Close Redis connection
 */
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    logger.info('Closing Redis connection...');
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
};

/**
 * Redis helper functions
 */
export const redisHelpers = {
  /**
   * Set with expiration
   */
  async setEx(key: string, value: string, expirySeconds: number): Promise<void> {
    const client = getRedisClient();
    await client.setEx(key, expirySeconds, value);
  },

  /**
   * Get value
   */
  async get(key: string): Promise<string | null> {
    const client = getRedisClient();
    return await client.get(key);
  },

  /**
   * Delete key
   */
  async del(key: string): Promise<void> {
    const client = getRedisClient();
    await client.del(key);
  },

  /**
   * Set JSON value with expiration
   */
  async setJSON(key: string, value: any, expirySeconds: number): Promise<void> {
    const client = getRedisClient();
    await client.setEx(key, expirySeconds, JSON.stringify(value));
  },

  /**
   * Get JSON value
   */
  async getJSON<T = any>(key: string): Promise<T | null> {
    const client = getRedisClient();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  },

  /**
   * Increment value
   */
  async incr(key: string): Promise<number> {
    const client = getRedisClient();
    return await client.incr(key);
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const client = getRedisClient();
    return (await client.exists(key)) === 1;
  },

  /**
   * Set value in hash
   */
  async hSet(key: string, field: string, value: string): Promise<void> {
    const client = getRedisClient();
    await client.hSet(key, field, value);
  },

  /**
   * Get value from hash
   */
  async hGet(key: string, field: string): Promise<string | undefined> {
    const client = getRedisClient();
    return await client.hGet(key, field);
  },

  /**
   * Get all values from hash
   */
  async hGetAll(key: string): Promise<Record<string, string>> {
    const client = getRedisClient();
    return await client.hGetAll(key);
  },
};

/**
 * Health check for Redis
 */
export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    if (!redisClient) {
      return false;
    }
    await redisClient.ping();
    return true;
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return false;
  }
};

