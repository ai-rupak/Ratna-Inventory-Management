const { body, param, query } = require('express-validator');
const STATUS = require('../../common/constants/status');

/**
 * Validation rules for creating a product
 */
const createProductValidation = [
  body('sku').optional().trim().notEmpty().withMessage('SKU cannot be empty'),
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('categoryId').isMongoId().withMessage('Valid categoryId is required'),
  body('weightUnit')
    .isIn(Object.values(STATUS.WEIGHT_UNIT))
    .withMessage(
      `Weight unit must be one of: ${Object.values(STATUS.WEIGHT_UNIT).join(', ')}`
    ),
  body('pricePerUnit')
    .isFloat({ min: 0 })
    .withMessage('Price per unit must be a positive number'),
  body('hsnCode').trim().notEmpty().withMessage('HSN code is required'),
  body('gstRate').isFloat({ min: 0, max: 100 }).withMessage('GST rate must be between 0 and 100'),
];

/**
 * Validation rules for updating a product
 */
const updateProductValidation = [
  param('id').isMongoId().withMessage('Invalid product ID'),
  body('sku').optional().trim().notEmpty().withMessage('SKU cannot be empty'),
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('categoryId').optional().isMongoId().withMessage('Invalid categoryId'),
  body('weightUnit')
    .optional()
    .isIn(Object.values(STATUS.WEIGHT_UNIT))
    .withMessage(
      `Weight unit must be one of: ${Object.values(STATUS.WEIGHT_UNIT).join(', ')}`
    ),
  body('pricePerUnit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price per unit must be a positive number'),
  body('hsnCode').optional().trim().notEmpty().withMessage('HSN code cannot be empty'),
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
  query('categoryId').optional().isMongoId().withMessage('Invalid categoryId format'),
  query('weightUnit').optional().trim(),
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
