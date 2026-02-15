const userRepository = require('./users.repository');
const { hashPassword, comparePassword } = require('../../common/utils/encryption.util');
const { ConflictError, NotFoundError } = require('../../common/constants/errors');

/**
 * User service - Business logic for user operations
 */
class UserService {
  /**
   * Create a new user
   */
  async createUser(data) {
    // Check if email already exists
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('Email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await userRepository.create({
      ...data,
      password: hashedPassword,
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get user by ID
   */
  async getUserById(id) {
    const user = await userRepository.findById(id, {
      include: { store: true },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get all users with pagination
   */
  async getAllUsers(page = 1, limit = 20, filters = {}) {
    const where = {};

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.storeId) {
      where.storeId = filters.storeId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const result = await userRepository.paginate(page, limit, {
      where,
      include: { store: true },
      orderBy: { createdAt: 'desc' },
    });

    // Remove passwords from all users
    result.data = result.data.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return result;
  }

  /**
   * Update user
   */
  async updateUser(id, data) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User');
    }

    // If email is being updated, check for conflicts
    if (data.email && data.email !== user.email) {
      const existingUser = await userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new ConflictError('Email already exists');
      }
    }

    // If password is being updated, hash it
    if (data.password) {
      data.password = await hashPassword(data.password);
    }

    const updatedUser = await userRepository.update(id, data);
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Delete user (soft delete by setting isActive to false)
   */
  async deleteUser(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User');
    }

    await userRepository.update(id, { isActive: false });
    return { message: 'User deactivated successfully' };
  }

  /**
   * Activate user
   */
  async activateUser(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User');
    }

    await userRepository.update(id, { isActive: true });
    return { message: 'User activated successfully' };
  }

  /**
   * Get users by store
   */
  async getUsersByStore(storeId) {
    const users = await userRepository.findByStore(storeId);

    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }
}

module.exports = new UserService();
