const logger = require('../../common/utils/logger.util');
const reportService = require('../../modules/audit/report.service');

// Lazily require Redis to avoid crashing when Redis is unavailable
let redis = null;
function getRedis() {
  if (!redis) {
    try {
      const Redis = require('ioredis');
      redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        lazyConnect: true,
        connectTimeout: 3000,
      });
      redis.on('error', err => logger.warn('[Report Cache] Redis error:', err.message));
    } catch {
      logger.warn('[Report Cache] ioredis not available — caching disabled');
    }
  }
  return redis;
}

const CACHE_TTL = 300; // 5 minutes

/**
 * Report Processor — pre-computes heavy report data and caches in Redis
 *
 * Job data shape:
 * {
 *   reportType: 'SALES' | 'INVENTORY' | 'TREND' | 'TOP_PRODUCTS' | 'DASHBOARD',
 *   filters: { storeId?, fromDate?, toDate?, limit? }
 * }
 */
const processReportJob = async job => {
  const { reportType, filters = {} } = job.data;
  logger.info(`[Report] Processing ${reportType} report`, { filters });

  let result;
  switch (reportType) {
    case 'SALES':
      result = await reportService.getSalesReport(filters);
      break;
    case 'INVENTORY':
      result = await reportService.getInventoryReport();
      break;
    case 'TREND':
      result = await reportService.getSalesTrend(filters);
      break;
    case 'TOP_PRODUCTS':
      result = await reportService.getTopProducts(filters);
      break;
    case 'DASHBOARD':
      result = await reportService.getDashboardKpis();
      break;
    default:
      logger.warn(`[Report] Unknown reportType: ${reportType}`);
      return { reportType, status: 'skipped', reason: 'unknown_type' };
  }

  // Cache in Redis with TTL
  try {
    const client = getRedis();
    if (client) {
      const cacheKey = `report:${reportType}:${JSON.stringify(filters)}`;
      await client.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
      logger.info(`[Report] Cached ${reportType} report → key=${cacheKey}, ttl=${CACHE_TTL}s`);
    }
  } catch (err) {
    logger.warn('[Report] Failed to cache result:', err.message);
  }

  logger.info(`[Report] ${reportType} report job completed`);
  return { reportType, status: 'done', recordCount: Array.isArray(result) ? result.length : 1 };
};

module.exports = processReportJob;
