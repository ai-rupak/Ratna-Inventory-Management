const express = require('express');
const productController = require('./products.controller');
const { authenticate } = require('../../common/middleware/auth.middleware');
const { requireRole } = require('../../common/middleware/rbac.middleware');
const { validate } = require('../../common/middleware/validate.middleware');
const {
  createProductValidation,
  updateProductValidation,
  productIdValidation,
  getProductsValidation,
  searchProductsValidation,
} = require('./products.validators');
const { ROLES } = require('../../common/constants/roles');

const router = express.Router();

// All product routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/products
 * @desc    Create a new product
 * @access  SUPER_ADMIN, STORE_ADMIN
 */
router.post(
  '/',
  requireRole(ROLES.SUPER_ADMIN, ROLES.STORE_ADMIN),
  createProductValidation,
  validate,
  productController.createProduct
);

/**
 * @route   GET /api/v1/products/search
 * @desc    Search products
 * @access  All authenticated users
 */
/**
 * @swagger
 * /api/v1/products/search:
 *   get:
 *     summary: Search products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Products search completed
 */
router.get('/search', searchProductsValidation, validate, productController.searchProducts);

/**
 * @route   GET /api/v1/products
 * @desc    Get all products
 * @access  All authenticated users
 */
router.get('/', getProductsValidation, validate, productController.getAllProducts);

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get product by ID
 * @access  All authenticated users
 */
router.get('/:id', productIdValidation, validate, productController.getProductById);

/**
 * @route   PATCH /api/v1/products/:id
 * @desc    Update product
 * @access  SUPER_ADMIN, STORE_ADMIN
 */
/**
 * @swagger
 * /api/v1/products/{id}:
 *   patch:
 *     summary: Update product
 *     tags: [Products]
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
 *             $ref: '#/components/schemas/UpdateProduct'
 *     responses:
 *       200:
 *         description: Product updated successfully
 */
router.patch(
  '/:id',
  requireRole(ROLES.SUPER_ADMIN, ROLES.STORE_ADMIN),
  updateProductValidation,
  validate,
  productController.updateProduct
);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Deactivate product
 * @access  SUPER_ADMIN
 */
/**
 * @swagger
 * /api/v1/products/{id}:
 *   delete:
 *     summary: Deactivate product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Product deactivated successfully
 */
router.delete(
  '/:id',
  requireRole(ROLES.SUPER_ADMIN),
  productIdValidation,
  validate,
  productController.deleteProduct
);

/**
 * @route   PATCH /api/v1/products/:id/activate
 * @desc    Activate product
 * @access  SUPER_ADMIN
 */
/**
 * @swagger
 * /api/v1/products/{id}/activate:
 *   patch:
 *     summary: Activate product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Product activated successfully
 */
router.patch(
  '/:id/activate',
  requireRole(ROLES.SUPER_ADMIN),
  productIdValidation,
  validate,
  productController.activateProduct
);

module.exports = router;
