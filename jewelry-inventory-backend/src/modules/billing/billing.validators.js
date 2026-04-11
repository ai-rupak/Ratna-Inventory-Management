const { body, query } = require('express-validator');

const createInvoiceValidator = [
  body('storeId').notEmpty().withMessage('storeId is required'),
  body('paymentMethod')
    .isIn(['CASH', 'CARD', 'UPI', 'MIXED'])
    .withMessage('paymentMethod must be CASH, CARD, UPI, or MIXED'),
  body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),
  body('items.*.productId').notEmpty().withMessage('each item must have a productId'),
  body('items.*.weight')
    .isFloat({ gt: 0 })
    .withMessage('each item weight must be a positive number (in RATI or CARAT as per product)'),
  body('items.*.stoneCount').optional().isInt({ min: 0 }),
  body('customer.name')
    .optional()
    .isString()
    .withMessage('customer name must be a string'),
  body('customer.phone')
    .optional()
    .isMobilePhone()
    .withMessage('customer phone must be a valid phone number'),
  body('customer.email').optional().isEmail(),
];

const listInvoicesValidator = [
  query('storeId').optional().isString(),
  query('status')
    .optional()
    .isIn(['DRAFT', 'COMPLETED', 'PARTIALLY_RETURNED', 'FULLY_RETURNED', 'CANCELLED']),
  query('fromDate').optional().isISO8601(),
  query('toDate').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

const upsertCustomerValidator = [
  body('name').notEmpty().withMessage('name is required'),
  body('phone').notEmpty().withMessage('phone is required'),
  body('email').optional().isEmail(),
  body('address').optional().isString(),
];

module.exports = {
  createInvoiceValidator,
  listInvoicesValidator,
  upsertCustomerValidator,
};
