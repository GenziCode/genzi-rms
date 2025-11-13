import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimit } from '../middleware/rateLimit.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import {
  loginValidation,
  refreshTokenValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyEmailValidation,
  changePasswordValidation,
} from '../validations/auth.validations';

const router = Router();

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', authRateLimit, [...loginValidation, validate], authController.login);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', [...refreshTokenValidation, validate], authController.refresh);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', resolveTenant, authenticate, authController.getProfile);

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', resolveTenant, authenticate, authController.logout);

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 */
router.post(
  '/forgot-password',
  authRateLimit,
  [...forgotPasswordValidation, validate],
  authController.forgotPassword
);

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post(
  '/reset-password',
  authRateLimit,
  [...resetPasswordValidation, validate],
  authController.resetPassword
);

/**
 * POST /api/auth/verify-email
 * Verify email with token
 */
router.post('/verify-email', [...verifyEmailValidation, validate], authController.verifyEmail);

/**
 * POST /api/auth/change-password
 * Change password (authenticated users only)
 */
router.post(
  '/change-password',
  authenticate,
  resolveTenant,
  [...changePasswordValidation, validate],
  authController.changePassword
);

/**
 * POST /api/auth/send-verification
 * Send email verification (authenticated users only)
 */
router.post('/send-verification', authenticate, resolveTenant, authController.sendVerification);

export default router;
