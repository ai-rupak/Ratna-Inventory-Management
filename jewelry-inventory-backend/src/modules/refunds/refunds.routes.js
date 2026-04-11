const { Router } = require('express');
const controller = require('./refunds.controller');
const { authenticate } = require('../../common/middleware/auth.middleware');
const { requireRole } = require('../../common/middleware/rbac.middleware');
const { validate } = require('../../common/middleware/validate.middleware');
const {
  initiateRefundValidator,
  approveRejectValidator,
  listRefundsValidator,
} = require('./refund.validators');

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Refunds
 *   description: RFID-based return and refund management
 */

/**
 * @swagger
 * /refunds:
 *   post:
 *     summary: Initiate a refund by scanning RFID
 *     description: |
 *       Looks up the invoice item by RFID, checks weight deviation against tolerance.
 *       Auto-approves if within tolerance (stock reversed immediately).
 *       Creates a PENDING refund if deviation exceeds tolerance.
 *     tags: [Refunds]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InitiateRefundRequest'
 *     responses:
 *       201:
 *         description: Refund initiated (auto-approved or pending)
 *       400:
 *         description: Validation error or item already returned
 *       404:
 *         description: RFID not found
 */
router.post(
  '/',
  requireRole('CASHIER', 'STORE_ADMIN', 'SUPER_ADMIN'),
  initiateRefundValidator,
  validate,
  controller.initiateRefund
);

/**
 * @swagger
 * /refunds:
 *   get:
 *     summary: List refunds with optional filters
 *     tags: [Refunds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, APPROVED, REJECTED, COMPLETED] }
 *       - in: query
 *         name: storeId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated refund list
 *       403:
 *         description: Forbidden — requires Store Admin or Super Admin
 */
router.get(
  '/',
  requireRole('CASHIER', 'STORE_ADMIN', 'SUPER_ADMIN'),
  listRefundsValidator,
  validate,
  controller.getAllRefunds
);

/**
 * @swagger
 * /refunds/{id}:
 *   get:
 *     summary: Get refund by ID
 *     tags: [Refunds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Refund details
 *       404:
 *         description: Refund not found
 */
router.get(
  '/:id',
  requireRole('CASHIER', 'STORE_ADMIN', 'SUPER_ADMIN'),
  controller.getRefundById
);

/**
 * @swagger
 * /refunds/{id}/approve:
 *   patch:
 *     summary: Approve a pending refund
 *     description: Approves the refund, reverses stock, and updates the invoice status.
 *     tags: [Refunds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approvalNotes: { type: string }
 *     responses:
 *       200:
 *         description: Refund approved and stock restored
 *       400:
 *         description: Refund is not in PENDING status
 *       403:
 *         description: Forbidden — requires Store Admin or Super Admin
 *       404:
 *         description: Refund not found
 */
router.patch(
  '/:id/approve',
  requireRole('CASHIER', 'STORE_ADMIN', 'SUPER_ADMIN'),
  approveRejectValidator,
  validate,
  controller.approveRefund
);

/**
 * @swagger
 * /refunds/{id}/reject:
 *   patch:
 *     summary: Reject a pending refund
 *     tags: [Refunds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approvalNotes: { type: string }
 *     responses:
 *       200:
 *         description: Refund rejected
 *       400:
 *         description: Refund is not in PENDING status
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Refund not found
 */
router.patch(
  '/:id/reject',
  requireRole('CASHIER', 'STORE_ADMIN', 'SUPER_ADMIN'),
  approveRejectValidator,
  validate,
  controller.rejectRefund
);

module.exports = router;
