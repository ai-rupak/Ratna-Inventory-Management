const { AuthorizationError } = require('../constants/errors');
const { hasPermission } = require('../constants/roles');

/**
 * Role-based access control middleware
 * @param {string[]} allowedRoles - Array of allowed roles
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthorizationError('User not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AuthorizationError(`Access denied. Required roles: ${allowedRoles.join(', ')}`)
      );
    }

    next();
  };
};

/**
 * Permission-based access control middleware
 * @param {string} permission - Required permission
 */
const requirePermission = permission => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthorizationError('User not authenticated'));
    }

    if (!hasPermission(req.user.role, permission)) {
      return next(new AuthorizationError(`Access denied. Required permission: ${permission}`));
    }

    next();
  };
};

/**
 * Store ownership check - Ensure user belongs to the store
 */
const requireStoreOwnership = (req, res, next) => {
  if (!req.user) {
    return next(new AuthorizationError('User not authenticated'));
  }

  // Super admin can access all stores
  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  // Get store ID from params or body
  const storeId = req.params.storeId || req.body.storeId;

  if (!storeId) {
    return next(new AuthorizationError('Store ID not provided'));
  }

  // Check if user belongs to the store
  if (req.user.storeId !== storeId) {
    return next(new AuthorizationError('Access denied. You do not belong to this store'));
  }

  next();
};

module.exports = {
  requireRole,
  requirePermission,
  requireStoreOwnership,
};
