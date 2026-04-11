const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  STORE_ADMIN: 'STORE_ADMIN',
  CASHIER: 'CASHIER',
};

const PERMISSIONS = {
  // User permissions
  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',

  // Store permissions
  STORES_CREATE: 'stores:create',
  STORES_READ: 'stores:read',
  STORES_UPDATE: 'stores:update',
  STORES_DELETE: 'stores:delete',

  // Product permissions
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_READ: 'products:read',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',

  // Inventory permissions
  INVENTORY_ALLOCATE: 'inventory:allocate',
  INVENTORY_ADJUST: 'inventory:adjust',
  INVENTORY_READ: 'inventory:read',

  // Billing permissions
  BILLING_CREATE: 'billing:create',
  BILLING_READ: 'billing:read',

  // Refund permissions
  REFUNDS_CREATE: 'refunds:create',
  REFUNDS_APPROVE: 'refunds:approve',
  REFUNDS_READ: 'refunds:read',

  // Report permissions
  REPORTS_VIEW: 'reports:view',
};

// Role-Permission mapping
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS), // All permissions

  [ROLES.STORE_ADMIN]: [
    // PERMISSIONS.USERS_CREATE,
    // PERMISSIONS.USERS_READ,
    // PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.STORES_READ,
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.BILLING_CREATE,
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.REFUNDS_CREATE,
    PERMISSIONS.REFUNDS_READ,
    PERMISSIONS.REPORTS_VIEW,
  ],

  [ROLES.CASHIER]: [
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.BILLING_CREATE,
    PERMISSIONS.BILLING_READ,
  ],
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
const hasPermission = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
};
