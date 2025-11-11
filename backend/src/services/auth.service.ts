import { getMasterConnection } from '../config/database';
import { UserSchema, IUser } from '../models/user.model';
import { TenantSchema } from '../models/tenant.model';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { UnauthorizedError, NotFoundError } from '../utils/appError';
import { logger } from '../utils/logger';

export class AuthService {
  /**
   * Login user
   */
  async login(
    email: string,
    password: string
  ): Promise<{ user: any; accessToken: string; refreshToken: string }> {
    const masterConn = await getMasterConnection();
    const User = masterConn.model('User', UserSchema);
    const Tenant = masterConn.model('Tenant', TenantSchema);

    // Find user by email (need to select password)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new UnauthorizedError('User account is not active');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if tenant is active
    const tenant = await Tenant.findById(user.tenantId);
    if (!tenant || tenant.status !== 'active') {
      throw new UnauthorizedError('Tenant account is not active');
    }

    // Update last login
    await User.updateOne(
      { _id: user._id },
      {
        $set: { lastLogin: new Date() },
        $inc: { loginCount: 1 },
      }
    );

    logger.info(`User logged in: ${user.email}`);

    // Generate tokens
    const tokenPayload = {
      id: user._id.toString(),
      tenantId: user.tenantId.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: {
        id: user._id,
        tenantId: user.tenantId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.getFullName(),
        role: user.role,
        permissions: user.permissions,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(
    refreshToken: string
  ): Promise<{ accessToken: string; expiresIn: string }> {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Get user to ensure still active
    const masterConn = await getMasterConnection();
    const User = masterConn.model('User', UserSchema);

    const user = await User.findById(decoded.id);

    if (!user || user.status !== 'active') {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Generate new access token
    const tokenPayload = {
      id: user._id.toString(),
      tenantId: user.tenantId.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);

    return {
      accessToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    };
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string): Promise<any> {
    const masterConn = await getMasterConnection();
    const User = masterConn.model('User', UserSchema);
    const Tenant = masterConn.model('Tenant', TenantSchema);

    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    const tenant = await Tenant.findById(user.tenantId);

    return {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.getFullName(),
      role: user.role,
      permissions: user.permissions,
      avatar: user.avatar,
      phone: user.phone,
      emailVerified: user.emailVerified,
      tenant: {
        id: tenant?._id,
        name: tenant?.name,
        subdomain: tenant?.subdomain,
        plan: tenant?.subscription.plan,
      },
    };
  }

  /**
   * Logout user (implement token blacklisting if needed)
   */
  async logout(userId: string): Promise<void> {
    logger.info(`User logged out: ${userId}`);
    // In a more advanced implementation, you would:
    // 1. Add token to Redis blacklist
    // 2. Clear refresh token from database/Redis
    // For now, client-side will remove tokens
  }
}

export const authService = new AuthService();

