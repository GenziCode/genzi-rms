import * as Sentry from '@sentry/node';
import { logger } from './logger';

let sentryInitialized = false;

export const initObservability = (): void => {
  if (sentryInitialized) {
    return;
  }

  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    logger.info('Sentry DSN not provided. Skipping Sentry initialization.');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.05'),
  });

  sentryInitialized = true;
  logger.info('Sentry observability initialized.');
};

export const captureException = (error: unknown, context?: Record<string, any>): void => {
  if (!sentryInitialized) {
    return;
  }

  Sentry.captureException(error, { extra: context });
};


