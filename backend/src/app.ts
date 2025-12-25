import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { errorHandler, notFound } from './middleware/error.middleware';
import { globalRateLimit } from './middleware/rateLimit.middleware';
import { httpLoggerStream, logger } from './utils/logger';
import { monitoringMiddleware } from './middleware/monitoring.middleware';
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
  const envOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const fallbackOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://192.168.11.100:3000',  // Local IP access
    'http://39.39.213.253:3000',  // Public IP access
    'http://39.39.213.253:5100',  // Public IP backend access
  ];
  const allowedOrigins = envOrigins.length > 0 ? envOrigins : fallbackOrigins;
  const allowAnyOrigin = allowedOrigins.includes('*');
  const allowedOriginSet = new Set(allowedOrigins);

  const isAllowedOrigin = (origin: string): boolean => {
    if (allowAnyOrigin || allowedOriginSet.has(origin)) {
      return true;
    }

    if (process.env.NODE_ENV !== 'production') {
      try {
        const hostname = new URL(origin).hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return true;
        }
        if (/^(10\.|192\.168\.)/.test(hostname)) {
          return true;
        }
        if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) {
          return true;
        }
      } catch {
        return false;
      }
    }

    return false;
  };

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Tenant',
        'Cache-Control',
        'Pragma',
        'X-Requested-With',
        'Accept',
        'Accept-Encoding',
        'Accept-Language',
        'Connection',
        'Host',
        'Origin',
        'Referer',
        'Sec-Fetch-Dest',
        'Sec-Fetch-Mode',
        'Sec-Fetch-Site',
        'User-Agent'
      ],
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Cookie parser
  app.use(cookieParser(process.env.COOKIE_SECRET || undefined));

  // Compression middleware
  app.use(compression());

  // HTTP request logger
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', { stream: httpLoggerStream }));
  }
  app.use(monitoringMiddleware());

  // Global rate limiting
  app.use('/api', globalRateLimit);

  // Serve static files (uploaded images, QR codes) - DISABLED
  // app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
