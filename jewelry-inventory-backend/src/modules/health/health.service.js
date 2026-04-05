const { prisma } = require('../../database/prisma/client');

/**
 * Health Service — probes database and Redis connectivity
 */
class HealthService {
  async check() {
    const checks = {};
    let overallStatus = 'healthy';

    // 1. Database probe
    try {
      await prisma.$runCommandRaw({ ping: 1 });
      checks.database = { status: 'ok' };
    } catch (err) {
      checks.database = { status: 'error', message: err.message };
      overallStatus = 'degraded';
    }

    // 2. Redis probe (use the shared ioredis instance from rate-limit middleware)
    try {
      const { redis } = require('../../common/middleware/rate-limit.middleware');
      if (redis && redis.status === 'ready') {
        await redis.ping();
        checks.redis = { status: 'ok' };
      } else {
        checks.redis = { status: 'unavailable', message: 'Redis client not ready' };
        overallStatus = 'degraded';
      }
    } catch (err) {
      checks.redis = { status: 'error', message: err.message };
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      checks,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new HealthService();
