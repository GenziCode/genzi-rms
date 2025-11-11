import rateLimit from 'express-rate-limit';
import { TenantRequest } from '../types';

/**
 * Global rate limiter
 */
export const globalRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // Increased for testing
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth endpoints rate limiter (stricter)
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 100, // Higher limit for development
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Per-tenant rate limiter
 */
export const tenantRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: async (req: TenantRequest) => {
    // Higher limits for development
    if (process.env.NODE_ENV !== 'production') {
      return 10000;
    }

    // Different limits based on subscription plan
    const planLimits: Record<string, number> = {
      free: 100,
      basic: 500,
      professional: 2000,
      enterprise: 10000,
    };

    const plan = req.tenant?.subscription.plan || 'free';
    return planLimits[plan] || 100;
  },
  keyGenerator: (req: TenantRequest) => req.tenant?.id || req.ip || 'unknown',
  message: 'Too many requests from this tenant, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
