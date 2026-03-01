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

// ── Audit Logs ─────────────────────────────────────────────────────────────
router.get(
  '/logs',
  requireRole('SUPER_ADMIN'),
  auditLogQueryValidator,
  validate,
  controller.getAuditLogs
);

// ── Reports ─────────────────────────────────────────────────────────────────
router.get(
  '/reports/sales',
  requireRole('STORE_ADMIN', 'SUPER_ADMIN'),
  salesReportValidator,
  validate,
  controller.getSalesReport
);

router.get(
  '/reports/inventory',
  requireRole('SUPER_ADMIN'),
  controller.getInventoryReport
);

router.get(
  '/reports/store/:storeId',
  requireRole('STORE_ADMIN', 'SUPER_ADMIN'),
  storeSummaryValidator,
  validate,
  controller.getStoreSummary
);

module.exports = router;
