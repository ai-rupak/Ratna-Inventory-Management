const { body, query, param } = require('express-validator');

const receiveStockValidator = [
  body('productId').notEmpty().withMessage('productId is required'),
  body('totalWeight').isFloat({ gt: 0 }).withMessage('totalWeight must be positive'),
  body('totalStones').optional().isInt({ min: 0 }).withMessage('totalStones must be non-negative'),
  body('notes').optional().isString(),
];

const allocateValidator = [
  body('productId').notEmpty().withMessage('productId is required'),
  body('storeId').notEmpty().withMessage('storeId is required'),
  body('weight').isFloat({ gt: 0 }).withMessage('weight must be positive'),
  body('stoneCount').optional().isInt({ min: 0 }),
  body('notes').optional().isString(),
];

const transferValidator = [
  body('fromStoreId').notEmpty().withMessage('fromStoreId is required'),
  body('toStoreId').notEmpty().withMessage('toStoreId is required'),
  body('productId').notEmpty().withMessage('productId is required'),
  body('weight').isFloat({ gt: 0 }).withMessage('weight must be positive'),
];

const ledgerQueryValidator = [
  query('type').optional().isIn(['ALLOCATION', 'SALE', 'REFUND', 'ADJUSTMENT']),
  query('productId').optional().isString(),
  query('storeId').optional().isString(),
  query('fromDate').optional().isISO8601().withMessage('fromDate must be ISO8601 date'),
  query('toDate').optional().isISO8601().withMessage('toDate must be ISO8601 date'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

const adjustStockValidator = [
  param('productId').notEmpty(),
  body('weightDelta').isFloat().withMessage('weightDelta is required (positive to add, negative to remove)'),
  body('notes').optional().isString(),
];

module.exports = {
  receiveStockValidator,
  allocateValidator,
  transferValidator,
  ledgerQueryValidator,
  adjustStockValidator,
};
