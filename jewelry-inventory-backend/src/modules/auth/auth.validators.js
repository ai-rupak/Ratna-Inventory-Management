const { body } = require('express-validator');

/**
 * Validation rules for login
 */
const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

/**
 * Validation rules for refresh token
 */
const refreshTokenValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

module.exports = {
  loginValidation,
  refreshTokenValidation,
};
