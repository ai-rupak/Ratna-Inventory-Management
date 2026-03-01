const { body, query } = require('express-validator');

const initiateRefundValidator = [
  body('rfid').notEmpty().withMessage('rfid is required'),
  body('returnedWeight').isFloat({ gt: 0 }).withMessage('returnedWeight must be a positive number'),
  body('reason').optional().isString(),
];

const approveRejectValidator = [
  body('notes').optional().isString(),
];

const listRefundsValidator = [
  query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED']),
  query('invoiceId').optional().isString(),
  query('fromDate').optional().isISO8601(),
  query('toDate').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

module.exports = { initiateRefundValidator, approveRejectValidator, listRefundsValidator };
