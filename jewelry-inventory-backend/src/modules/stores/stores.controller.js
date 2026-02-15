const storeService = require('./stores.service');
const { successResponse, paginatedResponse } = require('../../common/utils/response.util');

/**
 * Store controller - Handle HTTP requests
 */
class StoreController {
  /**
   * Create a new store
   */
  async createStore(req, res, next) {
    try {
      const store = await storeService.createStore(req.body);
      successResponse(res, store, 'Store created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get store by ID
   */
  async getStoreById(req, res, next) {
    try {
      const store = await storeService.getStoreById(req.params.id);
      successResponse(res, store, 'Store retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all stores
   */
  async getAllStores(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const filters = {
        city: req.query.city,
        state: req.query.state,
      };

      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === 'true';
      }

      const result = await storeService.getAllStores(page, limit, filters);
      paginatedResponse(res, result.data, result.pagination, 'Stores retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update store
   */
  async updateStore(req, res, next) {
    try {
      const store = await storeService.updateStore(req.params.id, req.body);
      successResponse(res, store, 'Store updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete store
   */
  async deleteStore(req, res, next) {
    try {
      const result = await storeService.deleteStore(req.params.id);
      successResponse(res, result, 'Store deactivated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activate store
   */
  async activateStore(req, res, next) {
    try {
      const result = await storeService.activateStore(req.params.id);
      successResponse(res, result, 'Store activated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get store statistics
   */
  async getStoreStats(req, res, next) {
    try {
      const stats = await storeService.getStoreStats(req.params.id);
      successResponse(res, stats, 'Store statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StoreController();
