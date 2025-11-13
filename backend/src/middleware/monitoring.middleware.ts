import { Request, Response, NextFunction } from 'express';
import { monitoringService } from '../utils/monitoring';
import { logger } from '../utils/logger';

const HTTP_MONITOR_SAMPLE_RATE = Number(process.env.MONITORING_HTTP_SAMPLE_RATE ?? '0.05');

export const monitoringMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;

      const shouldSample = Math.random() < HTTP_MONITOR_SAMPLE_RATE;
      const isError = res.statusCode >= 500;

      if (!shouldSample && !isError) {
        return;
      }

      const payload = {
        method: req.method,
        path: req.originalUrl || req.path,
        status: res.statusCode,
        duration,
        tenantId: (req as any).tenant?.id,
        userId: (req as any).user?.id,
      };

      monitoringService.trackHttpRequest(payload);

      if (isError) {
        logger.error(`HTTP ${res.statusCode} ${req.method} ${req.originalUrl} (${duration}ms)`);
      }
    });

    next();
  };
};


