const express = require('express');
const userController = require('./users.controller');
const { authenticate } = require('../../common/middleware/auth.middleware');
const { requireRole } = require('../../common/middleware/rbac.middleware');
const { validate } = require('../../common/middleware/validate.middleware');
const {
  createUserValidation,
  updateUserValidation,
  userIdValidation,
  getUsersValidation,
} = require('./users.validators');
const { ROLES } = require('../../common/constants/roles');

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/users
 * @desc    Create a new user
 * @access  SUPER_ADMIN, STORE_ADMIN
 */
router.post(
  '/',
  requireRole(ROLES.SUPER_ADMIN, ROLES.STORE_ADMIN),
  createUserValidation,
  validate,
  userController.createUser
);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users
 * @access  SUPER_ADMIN, STORE_ADMIN
 */
router.get(
  '/',
  requireRole(ROLES.SUPER_ADMIN, ROLES.STORE_ADMIN),
  getUsersValidation,
  validate,
  userController.getAllUsers
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  SUPER_ADMIN, STORE_ADMIN
 */
router.get(
  '/:id',
  requireRole(ROLES.SUPER_ADMIN, ROLES.STORE_ADMIN),
  userIdValidation,
  validate,
  userController.getUserById
);

/**
 * @route   PATCH /api/v1/users/:id
 * @desc    Update user
 * @access  SUPER_ADMIN, STORE_ADMIN
 */
router.patch(
  '/:id',
  requireRole(ROLES.SUPER_ADMIN, ROLES.STORE_ADMIN),
  updateUserValidation,
  validate,
  userController.updateUser
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Deactivate user
 * @access  SUPER_ADMIN, STORE_ADMIN
 */
router.delete(
  '/:id',
  requireRole(ROLES.SUPER_ADMIN, ROLES.STORE_ADMIN),
  userIdValidation,
  validate,
  userController.deleteUser
);

/**
 * @route   PATCH /api/v1/users/:id/activate
 * @desc    Activate user
 * @access  SUPER_ADMIN, STORE_ADMIN
 */
router.patch(
  '/:id/activate',
  requireRole(ROLES.SUPER_ADMIN, ROLES.STORE_ADMIN),
  userIdValidation,
  validate,
  userController.activateUser
);

/**
 * @route   GET /api/v1/users/store/:storeId
 * @desc    Get users by store
 * @access  SUPER_ADMIN, STORE_ADMIN
 */
router.get(
  '/store/:storeId',
  requireRole(ROLES.SUPER_ADMIN, ROLES.STORE_ADMIN),
  userController.getUsersByStore
);

module.exports = router;
