const { body, param, query } = require('express-validator');

/**
 * Validation rules for creating a store
 */
const createStoreValidation = [
  body('code').optional().trim().notEmpty().withMessage('Store code cannot be empty'),
  body('name').trim().notEmpty().withMessage('Store name is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone must be 10 digits'),
];

/**
 * Validation rules for updating a store
 */
const updateStoreValidation = [
  param('id').isMongoId().withMessage('Invalid store ID'),
  body('code').optional().trim().notEmpty().withMessage('Store code cannot be empty'),
  body('name').optional().trim().notEmpty().withMessage('Store name cannot be empty'),
  body('address').optional().trim().notEmpty().withMessage('Address cannot be empty'),
  body('city').optional().trim().notEmpty().withMessage('City cannot be empty'),
  body('state').optional().trim().notEmpty().withMessage('State cannot be empty'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone must be 10 digits'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

/**
 * Validation rules for store ID parameter
 */
const storeIdValidation = [param('id').isMongoId().withMessage('Invalid store ID')];

/**
 * Validation rules for query parameters
 */
const getStoresValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  query('city').optional().trim(),
  query('state').optional().trim(),
];

module.exports = {
  createStoreValidation,
  updateStoreValidation,
  storeIdValidation,
  getStoresValidation,
};
