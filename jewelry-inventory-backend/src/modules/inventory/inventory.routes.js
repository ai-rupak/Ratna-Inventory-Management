const { Router } = require('express');
const controller = require('./inventory.controller');
const { authenticate } = require('../../common/middleware/auth.middleware');
const { requireRole } = require('../../common/middleware/rbac.middleware');
const { validate } = require('../../common/middleware/validate.middleware');
const {
  receiveStockValidator,
  allocateValidator,
  transferValidator,
  ledgerQueryValidator,
  adjustStockValidator,
} = require('./inventory.validators');

const router = Router();

// All inventory routes require authentication
router.use(authenticate);

// ── Central Inventory ──────────────────────────────────────────────────────
// Receive stock (add to central)
router.post(
  '/central',
  requireRole('SUPER_ADMIN'),
  receiveStockValidator,
  validate,
  controller.receiveStock
);

// List all central inventory
router.get(
  '/central',
  requireRole('SUPER_ADMIN'),
  controller.getAllCentralInventory
);

// Get central stock for a specific product
router.get(
  '/central/:productId',
  requireRole('SUPER_ADMIN'),
  controller.getCentralInventoryByProduct
);

// Manual stock adjustment
router.patch(
  '/central/:productId/adjust',
  requireRole('SUPER_ADMIN'),
  adjustStockValidator,
  validate,
  controller.adjustStock
);

// ── Allocation ──────────────────────────────────────────────────────────────
// Allocate stock from central → store
router.post(
  '/allocate',
  requireRole('SUPER_ADMIN'),
  allocateValidator,
  validate,
  controller.allocate
);

// Inter-store transfer
router.post(
  '/transfer',
  requireRole('SUPER_ADMIN'),
  transferValidator,
  validate,
  controller.transfer
);

// ── Store Inventory ─────────────────────────────────────────────────────────
// Cross-store summary
router.get(
  '/summary',
  requireRole('SUPER_ADMIN'),
  controller.getInventorySummary
);

// Store-specific inventory
router.get(
  '/store/:storeId',
  requireRole('SUPER_ADMIN', 'STORE_ADMIN'),
  controller.getStoreInventory
);

// ── Ledger ──────────────────────────────────────────────────────────────────
router.get(
  '/ledger',
  requireRole('SUPER_ADMIN'),
  ledgerQueryValidator,
  validate,
  controller.getLedger
);

router.get(
  '/ledger/summary',
  requireRole('SUPER_ADMIN'),
  controller.getLedgerSummary
);

module.exports = router;
