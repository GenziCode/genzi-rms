import mongoose from 'mongoose';
import crypto from 'crypto';
import { getMasterConnection } from '../config/database';
import { UserSchema, IUser } from '../models/user.model';
import { TenantSchema } from '../models/tenant.model';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { UnauthorizedError, NotFoundError, BadRequestError } from '../utils/appError';
import { logger } from '../utils/logger';
import { emailService } from '../utils/email';

export class AuthService {
  /**
   * Login user
   */
  async login(
    email: string,
    password: string
  ): Promise<{
    user: Record<string, unknown>;
    tenant: Record<string, unknown>;
    accessToken: string;
    refreshToken: string;
  }> {
    const masterConn = await getMasterConnection();
    const User = masterConn.model<IUser>('User', UserSchema);
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
      id: (user._id as mongoose.Types.ObjectId).toString(),
      tenantId: (user.tenantId as mongoose.Types.ObjectId).toString(),
      email: user.email as string,
      role: user.role as string,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: {
        id: user._id as mongoose.Types.ObjectId,
        tenantId: user.tenantId as mongoose.Types.ObjectId,
        email: user.email as string,
        firstName: user.firstName as string,
        lastName: user.lastName as string,
        fullName: user.getFullName(),
        role: user.role as string,
        permissions: user.permissions as string[],
        avatar: user.avatar,
      },
      tenant: {
        id: tenant._id as mongoose.Types.ObjectId,
        subdomain: (tenant as { subdomain: string }).subdomain,
        name: (tenant as { name: string }).name,
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
    const User = masterConn.model<IUser>('User', UserSchema);

    const user = await User.findById(decoded.id);

    if (!user || user.status !== 'active') {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Generate new access token
    const tokenPayload = {
      id: (user._id as mongoose.Types.ObjectId).toString(),
      tenantId: (user.tenantId as mongoose.Types.ObjectId).toString(),
      email: user.email as string,
      role: user.role as string,
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
  async getProfile(userId: string): Promise<Record<string, unknown>> {
    const masterConn = await getMasterConnection();
    const User = masterConn.model<IUser>('User', UserSchema);
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

  /**
   * Forgot password - Send reset email
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const masterConn = await getMasterConnection();
    const User = masterConn.model<IUser>('User', UserSchema);

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if email exists or not (security best practice)
      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save hashed token and expiry to database
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    await user.save();

    // Send email
    try {
      await emailService.sendPasswordResetEmail(email, resetToken, user.getFullName());
      logger.info(`Password reset email sent to: ${email}`);
    } catch (error) {
      // Reset the fields if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpiry = undefined;
      await user.save();
      logger.error(`Failed to send password reset email to ${email}:`, error);
      throw new BadRequestError('Failed to send password reset email. Please try again later.');
    }

    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const masterConn = await getMasterConnection();
    const User = masterConn.model<IUser>('User', UserSchema);

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: new Date() }, // Token not expired
    }).select('+resetPasswordToken +resetPasswordExpiry');

    if (!user) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    // Send confirmation email
    try {
      await emailService.sendPasswordChangedEmail(user.email, user.getFullName());
    } catch (error) {
      logger.error(`Failed to send password changed email to ${user.email}:`, error);
      // Don't fail the request if email fails
    }

    logger.info(`Password reset successful for user: ${user.email}`);

    return {
      message: 'Password has been reset successfully. You can now log in with your new password.',
    };
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const masterConn = await getMasterConnection();
    const User = masterConn.model<IUser>('User', UserSchema);

    // Find user with valid verification token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: { $gt: new Date() }, // Token not expired
    }).select('+emailVerificationToken +emailVerificationExpiry');

    if (!user) {
      throw new BadRequestError('Invalid or expired verification token');
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();

    logger.info(`Email verified for user: ${user.email}`);

    return {
      message: 'Email verified successfully!',
    };
  }

  /**
   * Change password (for logged-in user)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const masterConn = await getMasterConnection();
    const User = masterConn.model<IUser>('User', UserSchema);

    // Find user and select password
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Check if new password is same as current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      throw new BadRequestError('New password must be different from current password');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Send confirmation email
    try {
      await emailService.sendPasswordChangedEmail(user.email, user.getFullName());
    } catch (error) {
      logger.error(`Failed to send password changed email to ${user.email}:`, error);
      // Don't fail the request if email fails
    }

    logger.info(`Password changed for user: ${user.email}`);

    return {
      message: 'Password changed successfully',
    };
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(userId: string): Promise<{ message: string }> {
    const masterConn = await getMasterConnection();
    const User = masterConn.model<IUser>('User', UserSchema);

    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestError('Email is already verified');
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Save hashed token and expiry to database
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    // Send email
    try {
      await emailService.sendEmailVerification(user.email, verificationToken, user.getFullName());
      logger.info(`Email verification sent to: ${user.email}`);
    } catch (error) {
      // Reset the fields if email fails
      user.emailVerificationToken = undefined;
      user.emailVerificationExpiry = undefined;
      await user.save();
      logger.error(`Failed to send verification email to ${user.email}:`, error);
      throw new BadRequestError('Failed to send verification email. Please try again later.');
    }

    return {
      message: 'Verification email sent successfully',
    };
  }
}

export const authService = new AuthService();
