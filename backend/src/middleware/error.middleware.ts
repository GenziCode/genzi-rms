import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/appError';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Handle known operational errors
  if (err instanceof AppError) {
    if (err instanceof ValidationError) {
      return res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      });
    }

    return sendError(res, err.message, err.statusCode, err.code);
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const mongooseError = err as any;
    const details = mongooseError?.errors
      ? Object.keys(mongooseError.errors).map((key) => ({
          field: key,
          message: mongooseError.errors[key]?.message,
          value: mongooseError.errors[key]?.value,
        }))
      : undefined;

    return sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', details);
  }

  // Handle Mongoose duplicate key errors
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    return sendError(res, 'Duplicate entry', 409, 'DUPLICATE_ENTRY');
  }

  // Handle Mongoose cast errors
  if (err.name === 'CastError') {
    return sendError(res, 'Invalid ID format', 400, 'INVALID_ID');
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', 401, 'TOKEN_EXPIRED');
  }

  // Default error response for unexpected errors
  const statusCode = process.env.NODE_ENV === 'production' ? 500 : 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Something went wrong';

  return sendError(res, message, statusCode, 'SERVER_ERROR');
};

/**
 * Handle 404 - Not Found
 */
export const notFound = (req: Request, res: Response): Response => {
  return sendError(
    res,
    `Route ${req.originalUrl} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

