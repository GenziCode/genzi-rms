import { Request, Response, NextFunction } from 'express';
import { TenantRequest } from '../types';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export class AuthController {
  /**
   * Login user
   * POST /api/auth/login
   */
  login = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    sendSuccess(
      res,
      {
        user: result.user,
        tenant: result.tenant, // Include tenant info
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      },
      'Login successful'
    );
  });

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  refresh = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { refreshToken } = req.body;

    const result = await authService.refreshAccessToken(refreshToken);

    sendSuccess(res, result, 'Token refreshed successfully');
  });

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  getProfile = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const profile = await authService.getProfile(req.user.id);

    sendSuccess(res, { user: profile });
  });

  /**
   * Logout user
   * POST /api/auth/logout
   */
  logout = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    await authService.logout(req.user.id);

    sendSuccess(res, null, 'Logout successful');
  });

  /**
   * Forgot password - Send reset email
   * POST /api/auth/forgot-password
   */
  forgotPassword = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { email } = req.body;

    const result = await authService.forgotPassword(email);

    sendSuccess(res, result, result.message);
  });

  /**
   * Reset password with token
   * POST /api/auth/reset-password
   */
  resetPassword = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { token, password } = req.body;

    const result = await authService.resetPassword(token, password);

    sendSuccess(res, result, result.message);
  });

  /**
   * Verify email with token
   * POST /api/auth/verify-email
   */
  verifyEmail = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { token } = req.body;

    const result = await authService.verifyEmail(token);

    sendSuccess(res, result, result.message);
  });

  /**
   * Change password (for logged-in user)
   * POST /api/auth/change-password
   */
  changePassword = asyncHandler(async (req: TenantRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const { currentPassword, newPassword } = req.body;

    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);

    sendSuccess(res, result, result.message);
  });

  /**
   * Send email verification
   * POST /api/auth/send-verification
   */
  sendVerification = asyncHandler(
    async (req: TenantRequest, res: Response, _next: NextFunction) => {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const result = await authService.sendEmailVerification(req.user.id);

      sendSuccess(res, result, result.message);
    }
  );
}

export const authController = new AuthController();
