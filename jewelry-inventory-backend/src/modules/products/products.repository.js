const BaseRepository = require('../../database/repositories/base.repository');

/**
 * Product repository
 */
class ProductRepository extends BaseRepository {
  constructor() {
    super('product');
  }

  /**
   * Find product by SKU
   */
  async findBySku(sku) {
    return this.findOne({ sku });
  }

  /**
   * Find products by category
   */
  async findByCategory(category) {
    return this.findMany({
      where: { category, isActive: true },
    });
  }

  /**
   * Find products by purity
   */
  async findByPurity(purity) {
    return this.findMany({
      where: { purity, isActive: true },
    });
  }

  /**
   * Search products
   */
  async search(searchTerm) {
    return this.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { sku: { contains: searchTerm, mode: 'insensitive' } },
          { category: { contains: searchTerm, mode: 'insensitive' } },
        ],
        isActive: true,
      },
    });
  }

  /**
   * Find active products
   */
  async findActive() {
    return this.findMany({
      where: { isActive: true },
    });
  }
}

module.exports = new ProductRepository();
