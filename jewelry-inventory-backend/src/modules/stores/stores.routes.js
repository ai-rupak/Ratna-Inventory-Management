const express = require('express');
const storeController = require('./stores.controller');
const { authenticate } = require('../../common/middleware/auth.middleware');
const { requireRole } = require('../../common/middleware/rbac.middleware');
const { validate } = require('../../common/middleware/validate.middleware');
const {
  createStoreValidation,
  updateStoreValidation,
  storeIdValidation,
  getStoresValidation,
} = require('./stores.validators');
const { ROLES } = require('../../common/constants/roles');

const router = express.Router();

// All store routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/stores
 * @desc    Create a new store
 * @access  SUPER_ADMIN
 */
router.post(
  '/',
  requireRole(ROLES.SUPER_ADMIN),
  createStoreValidation,
  validate,
  storeController.createStore
);

/**
 * @route   GET /api/v1/stores
 * @desc    Get all stores
 * @access  SUPER_ADMIN, STORE_ADMIN
 */
router.get(
  '/',
  requireRole(ROLES.SUPER_ADMIN, ROLES.STORE_ADMIN),
  getStoresValidation,
  validate,
  storeController.getAllStores
);

/**
 * @route   GET /api/v1/stores/:id
 * @desc    Get store by ID
 * @access  SUPER_ADMIN, STORE_ADMIN
 */
router.get(
  '/:id',
  requireRole(ROLES.SUPER_ADMIN, ROLES.STORE_ADMIN),
  storeIdValidation,
  validate,
  storeController.getStoreById
);

/**
 * @route   PATCH /api/v1/stores/:id
 * @desc    Update store
 * @access  SUPER_ADMIN
 */
router.patch(
  '/:id',
  requireRole(ROLES.SUPER_ADMIN),
  updateStoreValidation,
  validate,
  storeController.updateStore
);

/**
 * @route   DELETE /api/v1/stores/:id
 * @desc    Deactivate store
 * @access  SUPER_ADMIN
 */
router.delete(
  '/:id',
  requireRole(ROLES.SUPER_ADMIN),
  storeIdValidation,
  validate,
  storeController.deleteStore
);

/**
 * @route   PATCH /api/v1/stores/:id/activate
 * @desc    Activate store
 * @access  SUPER_ADMIN
 */
router.patch(
  '/:id/activate',
  requireRole(ROLES.SUPER_ADMIN),
  storeIdValidation,
  validate,
  storeController.activateStore
);

/**
 * @route   GET /api/v1/stores/:id/stats
 * @desc    Get store statistics
 * @access  SUPER_ADMIN, STORE_ADMIN
 */
router.get(
  '/:id/stats',
  requireRole(ROLES.SUPER_ADMIN, ROLES.STORE_ADMIN),
  storeIdValidation,
  validate,
  storeController.getStoreStats
);

module.exports = router;
