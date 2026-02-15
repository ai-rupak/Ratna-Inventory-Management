const { prisma } = require('../../database/prisma/client');
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
      const existingProduct = await prisma.product.findUnique({
        where: { sku: data.sku },
      });

      if (existingProduct) {
        throw new ConflictError('SKU already exists');
      }
    } else {
      // Generate SKU if not provided
      data.sku = this.generateSku(data.category, data.purity);
    }

    const product = await prisma.product.create({
      data,
    });

    return product;
  }

  /**
   * Get product by ID
   */
  async getProductById(id) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

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

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Search products
   */
  async searchProducts(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return [];
    }

    return prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { sku: { contains: searchTerm, mode: 'insensitive' } },
          { category: { contains: searchTerm, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      take: 20,
    });
  }

  /**
   * Update product
   */
  async updateProduct(id, data) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundError('Product');
    }

    // If SKU is being updated, check for conflicts
    if (data.sku && data.sku !== product.sku) {
      const existingProduct = await prisma.product.findUnique({
        where: { sku: data.sku },
      });

      if (existingProduct) {
        throw new ConflictError('SKU already exists');
      }
    }

    return prisma.product.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete product (soft delete by setting isActive to false)
   */
  async deleteProduct(id) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundError('Product');
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Product deactivated successfully' };
  }

  /**
   * Activate product
   */
  async activateProduct(id) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundError('Product');
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: true },
    });

    return { message: 'Product activated successfully' };
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category) {
    return prisma.product.findMany({
      where: {
        category: { contains: category, mode: 'insensitive' },
        isActive: true,
      },
    });
  }

  /**
   * Get products by purity
   */
  async getProductsByPurity(purity) {
    return prisma.product.findMany({
      where: {
        purity,
        isActive: true,
      },
    });
  }
}

module.exports = new ProductService();
