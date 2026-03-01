const { query } = require('express-validator');

const auditLogQueryValidator = [
  query('entity').optional().isString(),
  query('entityId').optional().isString(),
  query('userId').optional().isString(),
  query('action').optional().isString(),
  query('fromDate').optional().isISO8601(),
  query('toDate').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

const salesReportValidator = [
  query('storeId').optional().isString(),
  query('fromDate').optional().isISO8601().withMessage('fromDate must be ISO8601'),
  query('toDate').optional().isISO8601().withMessage('toDate must be ISO8601'),
];

const storeSummaryValidator = [
  query('fromDate').optional().isISO8601(),
  query('toDate').optional().isISO8601(),
];

module.exports = { auditLogQueryValidator, salesReportValidator, storeSummaryValidator };
