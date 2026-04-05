const logger = require('../../common/utils/logger.util');

/**
 * Report Processor — pre-computes heavy report data
 *
 * Job data shape:
 * {
 *   reportType: 'SALES' | 'INVENTORY',
 *   filters: { storeId?, fromDate?, toDate? }
 * }
 *
 * Phase 3: placeholder — delegates to report.service in the future.
 */
const processReportJob = async job => {
  const { reportType, filters } = job.data;
  logger.info(`[Report] Processing ${reportType} report`, { filters });

  // TODO Phase 4: compute report and cache result in Redis with TTL
  // const reportService = require('../../modules/audit/report.service');
  // const result = await reportService.getSalesReport(filters);
  // await redis.setex(`report:${reportType}:${hash(filters)}`, 300, JSON.stringify(result));

  logger.info(`[Report] ${reportType} report job completed`);
  return { reportType, status: 'queued' };
};

module.exports = processReportJob;
