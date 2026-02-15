const { body, param, query } = require('express-validator');
const STATUS = require('../../common/constants/status');

/**
 * Validation rules for creating a product
 */
const createProductValidation = [
  body('sku').optional().trim().notEmpty().withMessage('SKU cannot be empty'),
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('purity').trim().notEmpty().withMessage('Purity is required'),
  body('hsnCode').trim().notEmpty().withMessage('HSN code is required'),
  body('makingChargeType')
    .isIn(Object.values(STATUS.MAKING_CHARGE))
    .withMessage(
      `Making charge type must be one of: ${Object.values(STATUS.MAKING_CHARGE).join(', ')}`
    ),
  body('makingCharge')
    .isFloat({ min: 0 })
    .withMessage('Making charge must be a positive number'),
  body('gstRate').isFloat({ min: 0, max: 100 }).withMessage('GST rate must be between 0 and 100'),
];

/**
 * Validation rules for updating a product
 */
const updateProductValidation = [
  param('id').isMongoId().withMessage('Invalid product ID'),
  body('sku').optional().trim().notEmpty().withMessage('SKU cannot be empty'),
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('purity').optional().trim().notEmpty().withMessage('Purity cannot be empty'),
  body('hsnCode').optional().trim().notEmpty().withMessage('HSN code cannot be empty'),
  body('makingChargeType')
    .optional()
    .isIn(Object.values(STATUS.MAKING_CHARGE))
    .withMessage(
      `Making charge type must be one of: ${Object.values(STATUS.MAKING_CHARGE).join(', ')}`
    ),
  body('makingCharge')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Making charge must be a positive number'),
  body('gstRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('GST rate must be between 0 and 100'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

/**
 * Validation rules for product ID parameter
 */
const productIdValidation = [param('id').isMongoId().withMessage('Invalid product ID')];

/**
 * Validation rules for query parameters
 */
const getProductsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('category').optional().trim(),
  query('purity').optional().trim(),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

/**
 * Validation rules for search
 */
const searchProductsValidation = [
  query('q').trim().notEmpty().withMessage('Search query is required'),
];

module.exports = {
  createProductValidation,
  updateProductValidation,
  productIdValidation,
  getProductsValidation,
  searchProductsValidation,
};
