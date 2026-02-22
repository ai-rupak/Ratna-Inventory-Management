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
 * @swagger
 * components:
 *   schemas:
 *     Store:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         address:
 *           type: string
 *         isActive:
 *           type: boolean
 *
 *     CreateStore:
 *       type: object
 *       required:
 *         - name
 *         - city
 *         - state
 *       properties:
 *         name:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         address:
 *           type: string
 *
 *     UpdateStore:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         address:
 *           type: string
 */

/**
 * @route   POST /api/v1/stores
 * @desc    Create a new store
 * @access  SUPER_ADMIN
 */
/**
 * @swagger
 * /api/v1/stores:
 *   post:
 *     summary: Create a new store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStore'
 *     responses:
 *       201:
 *         description: Store created successfully
 *       403:
 *         description: Forbidden
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
/**
 * @swagger
 * /api/v1/stores:
 *   get:
 *     summary: Get all stores
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Stores retrieved successfully
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
/**
 * @swagger
 * /api/v1/stores/{id}:
 *   get:
 *     summary: Get store by ID
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Store retrieved successfully
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
/**
 * @swagger
 * /api/v1/stores/{id}:
 *   patch:
 *     summary: Update store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStore'
 *     responses:
 *       200:
 *         description: Store updated successfully
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
/**
 * @swagger
 * /api/v1/stores/{id}:
 *   delete:
 *     summary: Delete store
 *     description: Delete store a store by ID (soft delete)
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     responses:
 *       200:
 *         description: Store deactivated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Store not found
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
/**
 * @swagger
 * /api/v1/stores/{id}:
 *   delete:
 *     summary: Deactivate store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Store deactivated successfully
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
/**
 * @swagger
 * /api/v1/stores/{id}/stats:
 *   get:
 *     summary: Get store statistics
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Store statistics retrieved successfully
 */
router.get(
  '/:id/stats',
  requireRole(ROLES.SUPER_ADMIN, ROLES.STORE_ADMIN),
  storeIdValidation,
  validate,
  storeController.getStoreStats
);

module.exports = router;
