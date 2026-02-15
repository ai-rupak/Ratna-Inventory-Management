const express = require('express');
const authController = require('./auth.controller');
const { authenticate } = require('../../common/middleware/auth.middleware');
const { validate } = require('../../common/middleware/validate.middleware');
const { strictRateLimiter } = require('../../common/middleware/rate-limit.middleware');
const { loginValidation, refreshTokenValidation } = require('./auth.validators');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', strictRateLimiter, loginValidation, validate, authController.login);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', refreshTokenValidation, validate, authController.refreshToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
