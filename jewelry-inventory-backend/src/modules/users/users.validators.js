const { body, param, query } = require('express-validator');
const { ROLES } = require('../../common/constants/roles');

/**
 * Validation rules for creating a user
 */
const createUserValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('role')
    .isIn(Object.values(ROLES))
    .withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}`),
  body('storeId')
    .optional()
    .isMongoId()
    .withMessage('Invalid store ID'),
];

/**
 * Validation rules for updating a user
 */
const updateUserValidation = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('role')
    .optional()
    .isIn(Object.values(ROLES))
    .withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}`),
  body('storeId').optional().isMongoId().withMessage('Invalid store ID'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

/**
 * Validation rules for user ID parameter
 */
const userIdValidation = [param('id').isMongoId().withMessage('Invalid user ID')];

/**
 * Validation rules for query parameters
 */
const getUsersValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('role')
    .optional()
    .isIn(Object.values(ROLES))
    .withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}`),
  query('storeId').optional().isMongoId().withMessage('Invalid store ID'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

module.exports = {
  createUserValidation,
  updateUserValidation,
  userIdValidation,
  getUsersValidation,
};
