const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');

// Create Redis client for rate limiting
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

/**
 * Rate limiting middleware using Redis
 */
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: parseInt(process.env.RATE_LIMIT_TTL || '900', 10) * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests per window
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
    ...options,
  };

  return rateLimit(defaultOptions);
};

/**
 * Strict rate limiter for sensitive operations (login, etc.)
 */
const strictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 5 requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many attempts, please try again after 15 minutes',
    },
  },
});

/**
 * Standard rate limiter for general API endpoints
 */
const standardRateLimiter = createRateLimiter();

module.exports = {
  createRateLimiter,
  strictRateLimiter,
  standardRateLimiter,
  redis,
};
