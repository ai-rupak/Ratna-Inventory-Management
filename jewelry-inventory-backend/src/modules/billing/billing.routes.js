const { Router } = require('express');
const controller = require('./billing.controller');
const { authenticate } = require('../../common/middleware/auth.middleware');
const { requireRole } = require('../../common/middleware/rbac.middleware');
const { validate } = require('../../common/middleware/validate.middleware');
const {
  createInvoiceValidator,
  listInvoicesValidator,
  upsertCustomerValidator,
} = require('./billing.validators');

const router = Router();
router.use(authenticate);

// ── Invoices ─────────────────────────────────────────────────────────────

// Create invoice (cashier or store admin at POS)
router.post(
  '/invoices',
  requireRole('CASHIER', 'STORE_ADMIN', 'SUPER_ADMIN'),
  createInvoiceValidator,
  validate,
  controller.createInvoice
);

// List invoices
router.get(
  '/invoices',
  requireRole('CASHIER', 'STORE_ADMIN', 'SUPER_ADMIN'),
  listInvoicesValidator,
  validate,
  controller.getAllInvoices
);

// Get invoice by ID
router.get(
  '/invoices/:id',
  requireRole('CASHIER', 'STORE_ADMIN', 'SUPER_ADMIN'),
  controller.getInvoiceById
);

// Cancel invoice
router.patch(
  '/invoices/:id/cancel',
  requireRole('STORE_ADMIN', 'SUPER_ADMIN'),
  controller.cancelInvoice
);

// ── Customers ─────────────────────────────────────────────────────────────

// Upsert / find customer by phone
router.post(
  '/customers',
  requireRole('CASHIER', 'STORE_ADMIN', 'SUPER_ADMIN'),
  upsertCustomerValidator,
  validate,
  controller.upsertCustomer
);

// List customers
router.get(
  '/customers',
  requireRole('STORE_ADMIN', 'SUPER_ADMIN'),
  controller.getAllCustomers
);

// Get customer by ID (with recent invoice history)
router.get(
  '/customers/:id',
  requireRole('CASHIER', 'STORE_ADMIN', 'SUPER_ADMIN'),
  controller.getCustomerById
);

module.exports = router;
