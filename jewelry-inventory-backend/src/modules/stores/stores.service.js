const storeRepository = require('./stores.repository');
const { ConflictError, NotFoundError } = require('../../common/constants/errors');

/**
 * Store service - Business logic for store operations
 */
class StoreService {
  /**
   * Generate unique store code
   */
  generateStoreCode(name) {
    const prefix = name
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}`;
  }

  /**
   * Create a new store
   */
  async createStore(data) {
    // Check if code already exists
    if (data.code) {
      const existingStore = await storeRepository.findByCode(data.code);
      if (existingStore) {
        throw new ConflictError('Store code already exists');
      }
    } else {
      // Generate store code if not provided
      data.code = this.generateStoreCode(data.name);
    }

    const store = await storeRepository.create(data);
    return store;
  }

  /**
   * Get store by ID
   */
  async getStoreById(id) {
    const store = await storeRepository.findById(id, {
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundError('Store');
    }

    return store;
  }

  /**
   * Get all stores with pagination
   */
  async getAllStores(page = 1, limit = 20, filters = {}) {
    const where = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }

    if (filters.state) {
      where.state = { contains: filters.state, mode: 'insensitive' };
    }

    return storeRepository.paginate(page, limit, {
      where,
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update store
   */
  async updateStore(id, data) {
    const store = await storeRepository.findById(id);
    if (!store) {
      throw new NotFoundError('Store');
    }

    // If code is being updated, check for conflicts
    if (data.code && data.code !== store.code) {
      const existingStore = await storeRepository.findByCode(data.code);
      if (existingStore) {
        throw new ConflictError('Store code already exists');
      }
    }

    return storeRepository.update(id, data);
  }

  /**
   * Delete store (soft delete by setting isActive to false)
   */
  async deleteStore(id) {
    const store = await storeRepository.findById(id);
    if (!store) {
      throw new NotFoundError('Store');
    }

    await storeRepository.update(id, { isActive: false });
    return { message: 'Store deactivated successfully' };
  }

  /**
   * Activate store
   */
  async activateStore(id) {
    const store = await storeRepository.findById(id);
    if (!store) {
      throw new NotFoundError('Store');
    }

    await storeRepository.update(id, { isActive: true });
    return { message: 'Store activated successfully' };
  }

  /**
   * Get store statistics
   */
  async getStoreStats(id) {
    const store = await storeRepository.findById(id, {
      include: {
        users: {
          where: { isActive: true },
        },
        _count: {
          select: {
            users: true,
            storeInventories: true,
            invoices: true,
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundError('Store');
    }

    return {
      store: {
        id: store.id,
        code: store.code,
        name: store.name,
      },
      stats: {
        totalUsers: store._count.users,
        activeUsers: store.users.length,
        totalProducts: store._count.storeInventories,
        totalInvoices: store._count.invoices,
      },
    };
  }
}

module.exports = new StoreService();
