const { prisma } = require('../../database/prisma/client');
const { ConflictError, NotFoundError } = require('../../common/constants/errors');

/**
 * Product service - Business logic for product operations
 */
class ProductService {
  /**
   * Generate unique SKU
   */
  generateSku(categoryName, weightUnit) {
    const categoryPrefix = categoryName.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '');
    const unitCode = weightUnit || 'CAR';
    const timestamp = Date.now().toString().slice(-6);
    return `${categoryPrefix}-${unitCode}-${timestamp}`;
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
    }
    if (!data.sku) {
      // Generate SKU if not provided - fetch Category for name
      const categoryRec = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!categoryRec) throw new NotFoundError('Category');
      data.sku = this.generateSku(categoryRec.name, data.weightUnit);
    }

    const product = await prisma.product.create({
      data,
      include: { category: true }
    });

    return product;
  }

  /**
   * Get product by ID
   */
  async getProductById(id) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true }
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

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.weightUnit) {
      where.weightUnit = filters.weightUnit;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.storeId) {
      where.storeInventories = {
        some: { storeId: filters.storeId }
      };
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { category: true }
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
  async searchProducts(searchTerm, storeId = null) {
    if (!searchTerm || searchTerm.trim() === '') {
      return [];
    }

    const where = {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { sku: { contains: searchTerm, mode: 'insensitive' } },
        { category: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ],
      isActive: true,
    };

    if (storeId) {
      where.storeInventories = {
        some: { storeId }
      };
    }

    return prisma.product.findMany({
      where,
      take: 20,
      include: { category: true }
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
      include: { category: true }
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
  async getProductsByCategory(categoryId) {
    return prisma.product.findMany({
      where: {
        categoryId,
        isActive: true,
      },
      include: { category: true }
    });
  }

  /**
   * Get products by weight unit
   */
  async getProductsByWeightUnit(weightUnit) {
    return prisma.product.findMany({
      where: {
        weightUnit,
        isActive: true,
      },
      include: { category: true }
    });
  }
}

module.exports = new ProductService();
