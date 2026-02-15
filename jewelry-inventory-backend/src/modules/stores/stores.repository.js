const BaseRepository = require('../../database/repositories/base.repository');

/**
 * Store repository
 */
class StoreRepository extends BaseRepository {
  constructor() {
    super('store');
  }

  /**
   * Find store by code
   */
  async findByCode(code) {
    return this.findOne({ code });
  }

  /**
   * Find active stores
   */
  async findActive() {
    return this.findMany({
      where: { isActive: true },
    });
  }

  /**
   * Find stores with user count
   */
  async findWithUserCount() {
    return this.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
  }
}

module.exports = new StoreRepository();
