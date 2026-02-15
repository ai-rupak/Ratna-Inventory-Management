const userService = require('./users.service');
const { successResponse, paginatedResponse } = require('../../common/utils/response.util');

/**
 * User controller - Handle HTTP requests
 */
class UserController {
  /**
   * Create a new user
   */
  async createUser(req, res, next) {
    try {
      const user = await userService.createUser(req.body);
      successResponse(res, user, 'User created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      successResponse(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all users
   */
  async getAllUsers(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const filters = {
        role: req.query.role,
        storeId: req.query.storeId,
      };

      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === 'true';
      }

      const result = await userService.getAllUsers(page, limit, filters);
      paginatedResponse(res, result.data, result.pagination, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user
   */
  async updateUser(req, res, next) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      successResponse(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user
   */
  async deleteUser(req, res, next) {
    try {
      const result = await userService.deleteUser(req.params.id);
      successResponse(res, result, 'User deactivated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activate user
   */
  async activateUser(req, res, next) {
    try {
      const result = await userService.activateUser(req.params.id);
      successResponse(res, result, 'User activated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get users by store
   */
  async getUsersByStore(req, res, next) {
    try {
      const users = await userService.getUsersByStore(req.params.storeId);
      successResponse(res, users, 'Store users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
