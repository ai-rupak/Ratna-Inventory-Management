const Redis = require('ioredis');
const logger = require('../../common/utils/logger.util');

/**
 * Distributed lock service using Redis
 */
class DistributedLockService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: times => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.DEFAULT_TTL = 30000; // 30 seconds
    this.RETRY_DELAY = 100; // 100ms

    this.redis.on('error', err => {
      logger.error('Redis connection error:', err);
    });

    this.redis.on('connect', () => {
      logger.info('Redis connected successfully');
    });
  }

  /**
   * Acquire a distributed lock
   * @param {string} key - Lock key
   * @param {number} ttl - Time to live in milliseconds
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {Promise<string>} - Lock value
   */
  async acquireLock(key, ttl = this.DEFAULT_TTL, maxRetries = 10) {
    const lockKey = `lock:${key}`;
    const lockValue = this.generateLockValue();
    let retries = 0;

    while (retries < maxRetries) {
      const acquired = await this.redis.set(lockKey, lockValue, 'PX', ttl, 'NX');

      if (acquired === 'OK') {
        logger.debug(`Lock acquired: ${lockKey}`);
        return lockValue;
      }

      retries += 1;
      await this.delay(this.RETRY_DELAY * retries);
    }

    throw new Error(`Failed to acquire lock: ${key}`);
  }

  /**
   * Release a distributed lock
   * @param {string} key - Lock key
   * @param {string} lockValue - Lock value from acquireLock
   * @returns {Promise<void>}
   */
  async releaseLock(key, lockValue) {
    const lockKey = `lock:${key}`;

    // Lua script to ensure we only delete our own lock
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    const result = await this.redis.eval(script, 1, lockKey, lockValue);

    if (result === 1) {
      logger.debug(`Lock released: ${lockKey}`);
    }
  }

  /**
   * Execute operation with lock
   * @param {string} key - Lock key
   * @param {Function} operation - Async operation to execute
   * @param {number} ttl - Lock TTL
   * @returns {Promise<*>}
   */
  async withLock(key, operation, ttl) {
    const lockValue = await this.acquireLock(key, ttl);

    try {
      return await operation();
    } finally {
      await this.releaseLock(key, lockValue);
    }
  }

  /**
   * Generate unique lock value
   * @returns {string}
   */
  generateLockValue() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay helper
   * @param {number} ms
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }

  /**
   * Close Redis connection
   */
  async close() {
    await this.redis.quit();
    logger.info('Redis connection closed');
  }
}

module.exports = new DistributedLockService();
