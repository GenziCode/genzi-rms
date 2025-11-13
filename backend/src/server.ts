import dotenv from 'dotenv';
import { createApp } from './app';
import { getMasterConnection, closeAllConnections } from './config/database';
import { initRedis, closeRedis } from './config/redis';
import { logger } from './utils/logger';
import { initObservability } from './utils/observability';

// Load environment variables
dotenv.config();
initObservability();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Start server
 */
const startServer = async () => {
  try {
    logger.info('Starting Genzi RMS API Server...');
    logger.info(`Environment: ${NODE_ENV}`);

    // Initialize Master database connection
    logger.info('Initializing database connections...');
    const masterConn = await getMasterConnection();

    // Initialize master database models (creates collections and indexes)
    const { TenantSchema } = require('./models/tenant.model');
    const { UserSchema } = require('./models/user.model');

    logger.info('Creating master database collections...');
    const Tenant = masterConn.model('Tenant', TenantSchema);
    const User = masterConn.model('User', UserSchema);

    // Ensure indexes are created
    await Tenant.createIndexes();
    await User.createIndexes();

    logger.info('✅ Master database connected and initialized');

    // Initialize Redis (optional - skipped if REDIS_URL=skip)
    logger.info('Initializing Redis...');
    const redis = await initRedis();
    if (redis) {
      logger.info('✅ Redis connected');
    } else {
      logger.warn('⚠️  Redis not available - running without cache');
    }

    // Create Express app
    const app = createApp();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info('='.repeat(60));
      logger.info(`🚀 Genzi RMS API Server running!`);
      logger.info(`📍 URL: http://localhost:${PORT}`);
      logger.info(`📊 Environment: ${NODE_ENV}`);
      logger.info(`⏰ Started: ${new Date().toLocaleString()}`);
      logger.info('='.repeat(60));
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await closeAllConnections();
          await closeRedis();

          logger.info('All connections closed. Exiting process.');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
