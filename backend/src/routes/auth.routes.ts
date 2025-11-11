import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimit } from '../middleware/rateLimit.middleware';
import { isValidEmail } from '../utils/validators';

const router = Router();

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  authRateLimit,
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .custom((value) => {
        if (!isValidEmail(value)) {
          throw new Error('Invalid email format');
        }
        return true;
      }),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    
    validate,
  ],
  authController.login
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post(
  '/refresh',
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required'),
    validate,
  ],
  authController.refresh
);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, authController.getProfile);

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', authenticate, authController.logout);

export default router;

