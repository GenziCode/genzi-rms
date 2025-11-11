/**
 * Custom Application Error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;

  constructor(
    message: string,
    statusCode = 500,
    code = 'SERVER_ERROR',
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Predefined errors
export class ValidationError extends AppError {
  constructor(message: string, details?: any[]) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
  details?: any[];
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'TOO_MANY_REQUESTS');
  }
}

export class TenantNotFoundError extends AppError {
  constructor() {
    super('Tenant not found', 404, 'TENANT_NOT_FOUND');
  }
}

export class TenantSuspendedError extends AppError {
  constructor() {
    super('Tenant account is suspended', 403, 'TENANT_SUSPENDED');
  }
}

export class SubscriptionExpiredError extends AppError {
  constructor() {
    super('Subscription expired', 402, 'SUBSCRIPTION_EXPIRED');
  }
}

export class LimitExceededError extends AppError {
  constructor(resource: string, limit: number, current: number) {
    super(`${resource} limit exceeded (${current}/${limit})`, 429, 'LIMIT_EXCEEDED');
    this.limit = limit;
    this.current = current;
  }
  limit: number;
  current: number;
}

