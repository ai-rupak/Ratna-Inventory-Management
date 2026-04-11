const { Router } = require('express');
const controller = require('./audit.controller');
const { authenticate } = require('../../common/middleware/auth.middleware');
const { requireRole } = require('../../common/middleware/rbac.middleware');
const { validate } = require('../../common/middleware/validate.middleware');
const {
  auditLogQueryValidator,
  salesReportValidator,
  storeSummaryValidator,
} = require('./audit.validators');

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Audit
 *   description: Audit logs and business intelligence reports
 */

/**
 * @swagger
 * /audit/logs:
 *   get:
 *     summary: Query audit logs
 *     description: Returns a paginated, filterable list of all audit log entries. Super Admin only.
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entity
 *         schema: { type: string }
 *         description: Entity type to filter by (e.g. Invoice, Refund)
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *         description: Action type (e.g. CREATE, UPDATE, DELETE)
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *       - in: query
 *         name: fromDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: toDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated audit log entries
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       403:
 *         description: Forbidden — Super Admin only
 */
router.get('/logs', requireRole('SUPER_ADMIN'), auditLogQueryValidator, validate, controller.getAuditLogs);

/**
 * @swagger
 * /audit/reports/sales:
 *   get:
 *     summary: Sales report — revenue, units sold, by product/store/period
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema: { type: string }
 *       - in: query
 *         name: fromDate
 *         required: true
 *         schema: { type: string, format: date, example: "2025-01-01" }
 *       - in: query
 *         name: toDate
 *         required: true
 *         schema: { type: string, format: date, example: "2025-12-31" }
 *     responses:
 *       200:
 *         description: Aggregated sales report
 *       400:
 *         description: Missing required date range
 */
router.get('/reports/sales', requireRole('STORE_ADMIN', 'SUPER_ADMIN'), salesReportValidator, validate, controller.getSalesReport);

/**
 * @swagger
 * /audit/reports/inventory:
 *   get:
 *     summary: Inventory snapshot report across all stores
 *     description: Returns current stock levels for all products across central and store inventories.
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current inventory snapshot
 *       403:
 *         description: Forbidden — Super Admin only
 */
router.get('/reports/inventory', requireRole('SUPER_ADMIN'), controller.getInventoryReport);

/**
 * @swagger
 * /audit/reports/store/{storeId}:
 *   get:
 *     summary: Store summary dashboard
 *     description: Returns sales totals, inventory status, and refund counts for a specific store.
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: fromDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: toDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Store dashboard summary
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Store not found
 */
router.get('/reports/store/:storeId', requireRole('STORE_ADMIN', 'SUPER_ADMIN', 'CASHIER'), storeSummaryValidator, validate, controller.getStoreSummary);

/**
 * @swagger
 * /audit/reports/dashboard:
 *   get:
 *     summary: Global dashboard KPIs (Super Admin home screen)
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard KPIs — counts, today/monthly revenue, alert counts
 */
router.get('/reports/dashboard', requireRole('SUPER_ADMIN'), controller.getDashboardKpis);

/**
 * @swagger
 * /audit/reports/trend:
 *   get:
 *     summary: Day-by-day sales revenue trend (last 30 days by default)
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fromDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: toDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: storeId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Array of daily revenue data points for charting
 */
router.get('/reports/trend', requireRole('SUPER_ADMIN', 'STORE_ADMIN', 'CASHIER'), controller.getSalesTrend);

/**
 * @swagger
 * /audit/reports/top-products:
 *   get:
 *     summary: Top-selling products by weight sold
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fromDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: toDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Ranked product list with weight sold and estimated revenue
 */
router.get('/reports/top-products', requireRole('SUPER_ADMIN', 'STORE_ADMIN', 'CASHIER'), controller.getTopProducts);

module.exports = router;
