class BaseError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends BaseError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class AuthenticationError extends BaseError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends BaseError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends BaseError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class ConflictError extends BaseError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

class BusinessLogicError extends BaseError {
  constructor(message, code) {
    super(message, 400, code);
  }
}

class InsufficientStockError extends BusinessLogicError {
  constructor(available, requested) {
    super(
      `Insufficient stock. Available: ${available}, Requested: ${requested}`,
      'INSUFFICIENT_STOCK'
    );
    this.available = available;
    this.requested = requested;
  }
}

class WeightMismatchError extends BusinessLogicError {
  constructor(allocated, actual, tolerance) {
    super(
      `Weight deviation exceeds tolerance. Deviation: ${Math.abs(actual - allocated)}g, Tolerance: ${tolerance}g`,
      'WEIGHT_MISMATCH'
    );
    this.allocated = allocated;
    this.actual = actual;
    this.deviation = Math.abs(actual - allocated);
    this.tolerance = tolerance;
  }
}

class RateLimitError extends BaseError {
  constructor(retryAfter) {
    super('Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}

module.exports = {
  BaseError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BusinessLogicError,
  InsufficientStockError,
  WeightMismatchError,
  RateLimitError,
};
