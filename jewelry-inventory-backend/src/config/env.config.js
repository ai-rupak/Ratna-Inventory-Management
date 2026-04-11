'use strict';

/**
 * Environment Variable Validation
 * Called at the very start of server.js — fail fast if config is broken.
 */

const REQUIRED_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

const SECURITY_DEFAULTS = {
  JWT_SECRET: 'your-super-secret-jwt-key-change-in-production',
  JWT_REFRESH_SECRET: 'your-refresh-secret-key',
};

function validateEnv() {
  const missing = REQUIRED_VARS.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `\n[FATAL] Missing required environment variables:\n  ${missing.join('\n  ')}\n` +
      `Copy .env.example to .env and fill in the values.\n`
    );
    process.exit(1);
  }

  // Warn if production is using insecure defaults
  if (process.env.NODE_ENV === 'production') {
    const insecure = Object.entries(SECURITY_DEFAULTS).filter(
      ([key, defaultVal]) => process.env[key] === defaultVal
    );
    if (insecure.length > 0) {
      console.warn(
        `\n[WARN] Production is using insecure default values for:\n  ${insecure.map(([k]) => k).join('\n  ')}\n` +
        `Please update these in your production environment.\n`
      );
    }
  }

  // Validate PORT is a number
  const port = parseInt(process.env.PORT, 10);
  if (process.env.PORT && (isNaN(port) || port < 1 || port > 65535)) {
    console.error(`[FATAL] PORT must be a valid port number (1-65535), got: ${process.env.PORT}`);
    process.exit(1);
  }

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: port || 3000,
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtExpiration: process.env.JWT_EXPIRATION || '15m',
    jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: parseInt(process.env.REDIS_PORT, 10) || 6379,
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    logLevel: process.env.LOG_LEVEL || 'info',
    weightToleranceGrams: parseFloat(process.env.WEIGHT_TOLERANCE_GRAMS) || 0.01,
  };
}

module.exports = { validateEnv };
