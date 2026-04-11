const express = require('express');
const categoryController = require('./categories.controller');
const { authenticate } = require('../../common/middleware/auth.middleware');
const { requireRole } = require('../../common/middleware/rbac.middleware');
const { validate } = require('../../common/middleware/validate.middleware');
const {
  createCategoryValidation,
  updateCategoryValidation,
  categoryIdValidation,
} = require('./categories.validators');
const { ROLES } = require('../../common/constants/roles');

const router = express.Router();

// All category routes require authentication
router.use(authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         isActive:
 *           type: boolean
 *     CreateCategory:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *     UpdateCategory:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         isActive:
 *           type: boolean
 */

/**
 * @route   POST /api/v1/categories
 * @desc    Create a new category
 * @access  SUPER_ADMIN, STORE_ADMIN
 */
/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategory'
 *     responses:
 *       201:
 *         description: Category created successfully
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  requireRole(ROLES.SUPER_ADMIN),
  createCategoryValidation,
  validate,
  categoryController.createCategory
);

/**
 * @route   GET /api/v1/categories
 * @desc    Get all active categories
 * @access  All authenticated users
 */
/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
router.get('/', validate, categoryController.getAllCategories);

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Get category by ID
 * @access  All authenticated users
 */
/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Category retrieved
 *       404:
 *         description: Category not found
 */
router.get('/:id', categoryIdValidation, validate, categoryController.getCategoryById);

/**
 * @route   PATCH /api/v1/categories/:id
 * @desc    Update category
 * @access  SUPER_ADMIN, STORE_ADMIN
 */
/**
 * @swagger
 * /categories/{id}:
 *   patch:
 *     summary: Update category
 *     tags: [Categories]
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
 *             $ref: '#/components/schemas/UpdateCategory'
 *     responses:
 *       200:
 *         description: Category updated successfully
 */
router.patch(
  '/:id',
  requireRole(ROLES.SUPER_ADMIN),
  updateCategoryValidation,
  validate,
  categoryController.updateCategory
);

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Deactivate category
 * @access  SUPER_ADMIN
 */
/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Deactivate category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Category deactivated
 */
router.delete(
  '/:id',
  requireRole(ROLES.SUPER_ADMIN),
  categoryIdValidation,
  validate,
  categoryController.deleteCategory
);

module.exports = router;
