const BaseRepository = require('../../database/repositories/base.repository');

/**
 * User repository
 */
class UserRepository extends BaseRepository {
  constructor() {
    super('user');
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    return this.findOne({ email });
  }

  /**
   * Find users by role
   */
  async findByRole(role) {
    return this.findMany({ where: { role } });
  }

  /**
   * Find users by store
   */
  async findByStore(storeId) {
    return this.findMany({
      where: { storeId },
      include: { store: true },
    });
  }

  /**
   * Find active users
   */
  async findActive() {
    return this.findMany({
      where: { isActive: true },
    });
  }

  /**
   * Create user with store relation
   */
  async createWithStore(data) {
    return this.create(data);
  }
}

module.exports = new UserRepository();
