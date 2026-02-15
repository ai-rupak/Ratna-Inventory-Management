const productService = require('./products.service');
const { successResponse, paginatedResponse } = require('../../common/utils/response.util');

/**
 * Product controller - Handle HTTP requests
 */
class ProductController {
  /**
   * Create a new product
   */
  async createProduct(req, res, next) {
    try {
      const product = await productService.createProduct(req.body);
      successResponse(res, product, 'Product created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);
      successResponse(res, product, 'Product retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all products
   */
  async getAllProducts(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const filters = {
        category: req.query.category,
        purity: req.query.purity,
        isActive: req.query.isActive === 'true',
      };

      const result = await productService.getAllProducts(page, limit, filters);
      paginatedResponse(res, result.data, result.pagination, 'Products retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search products
   */
  async searchProducts(req, res, next) {
    try {
      const products = await productService.searchProducts(req.query.q);
      successResponse(res, products, 'Products search completed');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update product
   */
  async updateProduct(req, res, next) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      successResponse(res, product, 'Product updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(req, res, next) {
    try {
      const result = await productService.deleteProduct(req.params.id);
      successResponse(res, result, 'Product deactivated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activate product
   */
  async activateProduct(req, res, next) {
    try {
      const result = await productService.activateProduct(req.params.id);
      successResponse(res, result, 'Product activated successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
