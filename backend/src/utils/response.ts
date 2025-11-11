import { Response } from 'express';
import { ApiResponse, ApiError } from '../types';

/**
 * Create success response object
 */
export const successResponse = <T>(
  data?: T,
  message?: string,
  statusCode = 200,
  meta?: any
): ApiResponse<T> => {
  return {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
    ...(meta && { meta }),
  };
};

/**
 * Send success response
 */
export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200,
  meta?: any
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
    ...(meta && { meta }),
  };

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  code = 'SERVER_ERROR',
  details?: any[]
): Response => {
  const response: ApiError = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };

  return res.status(statusCode).json(response);
};

/**
 * Send validation error
 */
export const sendValidationError = (
  res: Response,
  errors: any[]
): Response => {
  return sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', errors);
};

/**
 * Send not found error
 */
export const sendNotFound = (
  res: Response,
  resource = 'Resource'
): Response => {
  return sendError(res, `${resource} not found`, 404, 'NOT_FOUND');
};

/**
 * Send unauthorized error
 */
export const sendUnauthorized = (
  res: Response,
  message = 'Unauthorized'
): Response => {
  return sendError(res, message, 401, 'UNAUTHORIZED');
};

/**
 * Send forbidden error
 */
export const sendForbidden = (
  res: Response,
  message = 'Forbidden'
): Response => {
  return sendError(res, message, 403, 'FORBIDDEN');
};

