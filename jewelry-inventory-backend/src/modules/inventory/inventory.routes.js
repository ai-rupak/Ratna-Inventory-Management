const { Router } = require('express');
const controller = require('./inventory.controller');
const { authenticate } = require('../../common/middleware/auth.middleware');
const { requireRole, requireStoreOwnership } = require('../../common/middleware/rbac.middleware');
const { validate } = require('../../common/middleware/validate.middleware');
const {
  receiveStockValidator,
  allocateValidator,
  transferValidator,
  ledgerQueryValidator,
  adjustStockValidator,
} = require('./inventory.validators');

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Central and store-level inventory management
 */

// ── Central Inventory ─────────────────────────────────────────────────────

/**
 * @swagger
 * /inventory/central:
 *   post:
 *     summary: Receive stock into central inventory
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReceiveStockRequest'
 *     responses:
 *       201:
 *         description: Stock received successfully
 *       404:
 *         description: Product not found
 */
router.post('/central', requireRole('SUPER_ADMIN'), receiveStockValidator, validate, controller.receiveStock);

/**
 * @swagger
 * /inventory/central:
 *   get:
 *     summary: List all central inventory
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Central inventory list
 */
router.get('/central', requireRole('SUPER_ADMIN'), controller.getAllCentralInventory);

/**
 * @swagger
 * /inventory/central/{productId}:
 *   get:
 *     summary: Get central stock for a specific product
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Central inventory for this product
 *       404:
 *         description: No inventory found for product
 */
router.get('/central/:productId', requireRole('SUPER_ADMIN'), controller.getCentralInventoryByProduct);

/**
 * @swagger
 * /inventory/central/{productId}/adjust:
 *   patch:
 *     summary: Manual stock adjustment (correction)
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [adjustmentWeight, reason]
 *             properties:
 *               adjustmentWeight: { type: number, description: Positive to add, negative to deduct }
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Stock adjusted
 *       404:
 *         description: Central inventory not found
 */
router.patch('/central/:productId/adjust', requireRole('SUPER_ADMIN'), adjustStockValidator, validate, controller.adjustStock);

// ── Allocation ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /inventory/allocate:
 *   post:
 *     summary: Allocate stock from central inventory to a store (ACID)
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AllocateRequest'
 *     responses:
 *       201:
 *         description: Stock allocated to store
 *       400:
 *         description: Insufficient central stock
 *       404:
 *         description: Product or store not found
 */
router.post('/allocate', requireRole('SUPER_ADMIN'), allocateValidator, validate, controller.allocate);

/**
 * @swagger
 * /inventory/transfer:
 *   post:
 *     summary: Transfer stock between stores (ACID)
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, fromStoreId, toStoreId, weight]
 *             properties:
 *               productId: { type: string }
 *               fromStoreId: { type: string }
 *               toStoreId: { type: string }
 *               weight: { type: number, example: 25.0 }
 *               stoneCount: { type: integer }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Stock transferred between stores
 *       400:
 *         description: Insufficient source store stock
 */
router.post('/transfer', requireRole('SUPER_ADMIN'), transferValidator, validate, controller.transfer);

// ── Store Inventory ───────────────────────────────────────────────────────

/**
 * @swagger
 * /inventory/summary:
 *   get:
 *     summary: Cross-store inventory summary
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregated inventory across all stores
 */
router.get('/summary', requireRole('SUPER_ADMIN'), controller.getInventorySummary);

/**
 * @swagger
 * /inventory/store/{storeId}:
 *   get:
 *     summary: View all inventory items for a specific store
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Store inventory list
 */
router.get('/store/:storeId', requireRole('SUPER_ADMIN', 'STORE_ADMIN', 'CASHIER'), requireStoreOwnership, controller.getStoreInventory);

// ── Ledger ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /inventory/ledger:
 *   get:
 *     summary: Query the inventory movement ledger
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [ALLOCATION, SALE, REFUND, ADJUSTMENT] }
 *       - in: query
 *         name: productId
 *         schema: { type: string }
 *       - in: query
 *         name: storeId
 *         schema: { type: string }
 *       - in: query
 *         name: fromDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: toDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated ledger entries
 */
router.get('/ledger', requireRole('SUPER_ADMIN'), ledgerQueryValidator, validate, controller.getLedger);

/**
 * @swagger
 * /inventory/ledger/summary:
 *   get:
 *     summary: Ledger summary grouped by movement type
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ledger totals by type (ALLOCATION, SALE, REFUND, ADJUSTMENT)
 */
router.get('/ledger/summary', requireRole('SUPER_ADMIN'), controller.getLedgerSummary);

module.exports = router;
