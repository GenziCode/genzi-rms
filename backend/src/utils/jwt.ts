import jwt from 'jsonwebtoken';
import { AppError } from './appError';

interface TokenPayload {
  id: string;
  tenantId: string;
  email: string;
  role: string;
}

/**
 * Generate access token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('JWT_SECRET not configured', 500);
  }

  return jwt.sign(payload, secret as string, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new AppError('JWT_REFRESH_SECRET not configured', 500);
  }

  return jwt.sign(payload, secret as string, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('JWT_SECRET not configured', 500);
  }

  try {
    return jwt.verify(token, secret as string) as TokenPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }
    throw error;
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new AppError('JWT_REFRESH_SECRET not configured', 500);
  }

  try {
    return jwt.verify(token, secret as string) as TokenPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Refresh token expired', 401, 'REFRESH_TOKEN_EXPIRED');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }
    throw error;
  }
};

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.decode(token);
    return decoded && typeof decoded === 'object' ? decoded as TokenPayload : null;
  } catch (error) {
    return null;
  }
};

