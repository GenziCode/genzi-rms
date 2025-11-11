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
}

export const authController = new AuthController();

