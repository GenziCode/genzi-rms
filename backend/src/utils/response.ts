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
  let formattedMessage = message;

  if (details && details.length > 0) {
    const summary = details
      .map((detail) => {
        if (typeof detail === 'string') return detail;
        const field = detail.field || detail.param;
        const msg = detail.message || detail.msg;
        return field ? `${field}: ${msg}` : msg;
      })
      .filter(Boolean)
      .join('; ');

    if (summary) {
      formattedMessage = `${message} – ${summary}`;
    }
  }

  const response: ApiError = {
    success: false,
    error: {
      code,
      message: formattedMessage,
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
  errors: Array<{ field?: string; message: string; value?: any }>
): Response => {
  const summary = errors
    ?.map((err) => {
      const label = err.field ? `${err.field}` : 'field';
      return `${label}: ${err.message}`;
    })
    .join('; ');

  const message = summary ? `Validation failed – ${summary}` : 'Validation failed';

  return sendError(res, message, 400, 'VALIDATION_ERROR', errors);
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

