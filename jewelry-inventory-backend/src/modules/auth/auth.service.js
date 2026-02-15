const jwt = require('jsonwebtoken');
const userRepository = require('../users/users.repository');
const { comparePassword } = require('../../common/utils/encryption.util');
const { AuthenticationError, NotFoundError } = require('../../common/constants/errors');
const { redis } = require('../../common/middleware/rate-limit.middleware');

/**
 * Auth service - Handle authentication logic
 */
class AuthService {
  /**
   * Generate JWT access token
   */
  generateAccessToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      storeId: user.storeId,
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION || '15m',
    });
  }

  /**
   * Generate JWT refresh token
   */
  generateRefreshToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
    };

    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    });
  }

  /**
   * Login user
   */
  async login(email, password) {
    // Find user by email
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AuthenticationError('User account is deactivated');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Store refresh token in Redis with expiration
    const refreshTokenKey = `refresh_token:${user.id}`;
    const refreshTokenExpiry = 7 * 24 * 60 * 60; // 7 days in seconds
    await redis.setex(refreshTokenKey, refreshTokenExpiry, refreshToken);

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Check if refresh token exists in Redis
      const refreshTokenKey = `refresh_token:${decoded.id}`;
      const storedToken = await redis.get(refreshTokenKey);

      if (!storedToken || storedToken !== refreshToken) {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Get user
      const user = await userRepository.findById(decoded.id);

      if (!user || !user.isActive) {
        throw new AuthenticationError('User not found or inactive');
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(user);

      // Optionally rotate refresh token
      const newRefreshToken = this.generateRefreshToken(user);
      const refreshTokenExpiry = 7 * 24 * 60 * 60;
      await redis.setex(refreshTokenKey, refreshTokenExpiry, newRefreshToken);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new AuthenticationError('Invalid or expired refresh token');
      }
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(userId) {
    // Remove refresh token from Redis
    const refreshTokenKey = `refresh_token:${userId}`;
    await redis.del(refreshTokenKey);

    return { message: 'Logged out successfully' };
  }

  /**
   * Get current user profile
   */
  async getProfile(userId) {
    const user = await userRepository.findById(userId, {
      include: { store: true },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

module.exports = new AuthService();
