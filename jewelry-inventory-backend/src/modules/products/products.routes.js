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
router.patch(
  '/:id/activate',
  requireRole(ROLES.SUPER_ADMIN),
  productIdValidation,
  validate,
  productController.activateProduct
);

module.exports = router;
