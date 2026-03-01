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

// Initiate a refund (scan RFID at POS)
router.post(
  '/',
  requireRole('CASHIER', 'STORE_ADMIN', 'SUPER_ADMIN'),
  initiateRefundValidator,
  validate,
  controller.initiateRefund
);

// List refunds
router.get(
  '/',
  requireRole('STORE_ADMIN', 'SUPER_ADMIN'),
  listRefundsValidator,
  validate,
  controller.getAllRefunds
);

// Get refund by ID
router.get(
  '/:id',
  requireRole('CASHIER', 'STORE_ADMIN', 'SUPER_ADMIN'),
  controller.getRefundById
);

// Approve a pending refund
router.patch(
  '/:id/approve',
  requireRole('STORE_ADMIN', 'SUPER_ADMIN'),
  approveRejectValidator,
  validate,
  controller.approveRefund
);

// Reject a pending refund
router.patch(
  '/:id/reject',
  requireRole('STORE_ADMIN', 'SUPER_ADMIN'),
  approveRejectValidator,
  validate,
  controller.rejectRefund
);

module.exports = router;
