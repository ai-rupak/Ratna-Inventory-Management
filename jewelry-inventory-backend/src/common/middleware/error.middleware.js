const logger = require('../utils/logger.util');
const { errorResponse } = require('../utils/response.util');
const { BaseError } = require('../constants/errors');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Handle operational errors
  if (err.isOperational) {
    return errorResponse(res, err.message, err.statusCode, err.code, err.details);
  }

  // Handle Prisma errors
  if (err.code && err.code.startsWith('P')) {
    return handlePrismaError(err, res);
  }

  // Handle validation errors from express-validator
  if (err.array && typeof err.array === 'function') {
    const errors = err.array();
    return errorResponse(res, 'Validation failed', 400, 'VALIDATION_ERROR', errors);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid token', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Token expired', 401, 'TOKEN_EXPIRED');
  }

  // Default to 500 server error
  const message =
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

  return errorResponse(res, message, 500, 'INTERNAL_SERVER_ERROR');
};

/**
 * Handle Prisma-specific errors
 */
const handlePrismaError = (err, res) => {
  switch (err.code) {
    case 'P2002': // Unique constraint violation
      return errorResponse(
        res,
        `Duplicate value for ${err.meta?.target?.join(', ')}`,
        409,
        'DUPLICATE_ENTRY'
      );

    case 'P2025': // Record not found
      return errorResponse(res, 'Record not found', 404, 'NOT_FOUND');

    case 'P2003': // Foreign key constraint violation
      return errorResponse(res, 'Related record not found', 400, 'FOREIGN_KEY_VIOLATION');

    case 'P2014': // Invalid ID
      return errorResponse(res, 'Invalid ID provided', 400, 'INVALID_ID');

    default:
      logger.error('Unhandled Prisma error:', err);
      return errorResponse(res, 'Database error occurred', 500, 'DATABASE_ERROR');
  }
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  errorResponse(res, `Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
