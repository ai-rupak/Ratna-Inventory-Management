const productRepository = require('./products.repository');
const { ConflictError, NotFoundError } = require('../../common/constants/errors');

/**
 * Product service - Business logic for product operations
 */
class ProductService {
  /**
   * Generate unique SKU
   */
  generateSku(category, purity) {
    const categoryPrefix = category.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '');
    const purityCode = purity.replace(/[^A-Z0-9]/g, '');
    const timestamp = Date.now().toString().slice(-6);
    return `${categoryPrefix}-${purityCode}-${timestamp}`;
  }

  /**
   * Create a new product
   */
  async createProduct(data) {
    // Check if SKU already exists
    if (data.sku) {
      const existingProduct = await productRepository.findBySku(data.sku);
      if (existingProduct) {
        throw new ConflictError('SKU already exists');
      }
    } else {
      // Generate SKU if not provided
      data.sku = this.generateSku(data.category, data.purity);
    }

    const product = await productRepository.create(data);
    return product;
  }

  /**
   * Get product by ID
   */
  async getProductById(id) {
    const product = await productRepository.findById(id);

    if (!product) {
      throw new NotFoundError('Product');
    }

    return product;
  }

  /**
   * Get all products with pagination
   */
  async getAllProducts(page = 1, limit = 20, filters = {}) {
    const where = {};

    if (filters.category) {
      where.category = { contains: filters.category, mode: 'insensitive' };
    }

    if (filters.purity) {
      where.purity = filters.purity;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return productRepository.paginate(page, limit, {
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Search products
   */
  async searchProducts(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return [];
    }

    return productRepository.search(searchTerm);
  }

  /**
   * Update product
   */
  async updateProduct(id, data) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product');
    }

    // If SKU is being updated, check for conflicts
    if (data.sku && data.sku !== product.sku) {
      const existingProduct = await productRepository.findBySku(data.sku);
      if (existingProduct) {
        throw new ConflictError('SKU already exists');
      }
    }

    return productRepository.update(id, data);
  }

  /**
   * Delete product (soft delete by setting isActive to false)
   */
  async deleteProduct(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product');
    }

    await productRepository.update(id, { isActive: false });
    return { message: 'Product deactivated successfully' };
  }

  /**
   * Activate product
   */
  async activateProduct(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product');
    }

    await productRepository.update(id, { isActive: true });
    return { message: 'Product activated successfully' };
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category) {
    return productRepository.findByCategory(category);
  }

  /**
   * Get products by purity
   */
  async getProductsByPurity(purity) {
    return productRepository.findByPurity(purity);
  }
}

module.exports = new ProductService();
