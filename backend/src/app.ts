import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import { errorHandler, notFound } from './middleware/error.middleware';
import { globalRateLimit } from './middleware/rateLimit.middleware';
import { httpLoggerStream, logger } from './utils/logger';
import routes from './routes';

/**
 * Create Express application
 */
export const createApp = (): Application => {
  const app = express();

  // Trust proxy (for deployment behind load balancer)
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // CORS configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant'],
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Cookie parser
  app.use(cookieParser(process.env.COOKIE_SECRET));

  // Compression middleware
  app.use(compression());

  // HTTP request logger
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', { stream: httpLoggerStream }));
  }

  // Global rate limiting
  app.use('/api', globalRateLimit);

  // Serve static files (uploaded images, QR codes)
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Root endpoint
  app.get('/', (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        message: 'Genzi RMS API',
        version: '1.0.0',
        docs: '/api/docs',
        health: '/api/health',
      },
    });
  });

  // API routes
  app.use('/api', routes);

  // 404 handler (must be after all routes)
  app.use(notFound);

  // Global error handler (must be last)
  app.use(errorHandler);

  logger.info('Express app configured successfully');

  return app;
};

