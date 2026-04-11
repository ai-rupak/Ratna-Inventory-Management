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
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *         storeId:
 *           type: string
 *         isActive:
 *           type: boolean
 *
 *     CreateUser:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - role
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *         storeId:
 *           type: string
 *         password:
 *           type: string
 *
 *     UpdateUser:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *         storeId:
 *           type: string
 */
/**
 * @route   POST /api/v1/users
 * @desc    Create a new user
 * @access  SUPER_ADMIN, STORE_ADMIN
 */
/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUser'
 *     responses:
 *       201:
 *         description: User created successfully
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  requireRole(ROLES.SUPER_ADMIN),
  createUserValidation,
  validate,
  userController.createUser
);
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
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
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
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
/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
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
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
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
/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update user
 *     tags: [Users]
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
 *             $ref: '#/components/schemas/UpdateUser'
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.patch(
  '/:id',
  requireRole(ROLES.SUPER_ADMIN),
  updateUserValidation,
  validate,
  userController.updateUser
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Deactivate user
 * @access  SUPER_ADMIN, STORE_ADMIN
 */
/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Deactivate user
 *     description: Soft-deletes (deactivates) a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: User deactivated successfully
 */
router.delete(
  '/:id',
  requireRole(ROLES.SUPER_ADMIN),
  userIdValidation,
  validate,
  userController.deleteUser
);

/**
 * @route   PATCH /api/v1/users/:id/activate
 * @desc    Activate user
 * @access  SUPER_ADMIN, STORE_ADMIN
 */
/**
 * @swagger
 * /users/{id}/activate:
 *   patch:
 *     summary: Activate user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: User activated successfully
 */
router.patch(
  '/:id/activate',
  requireRole(ROLES.SUPER_ADMIN),
  userIdValidation,
  validate,
  userController.activateUser
);

/**
 * @route   GET /api/v1/users/store/:storeId
 * @desc    Get users by store
 * @access  SUPER_ADMIN, STORE_ADMIN
 */
/**
 * @swagger
 * /users/store/{storeId}:
 *   get:
 *     summary: Get users by store
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Store users retrieved successfully
 */
router.get(
  '/store/:storeId',
  requireRole(ROLES.SUPER_ADMIN, ROLES.STORE_ADMIN),
  userController.getUsersByStore
);

module.exports = router;

