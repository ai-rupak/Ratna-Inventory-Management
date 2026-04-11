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

/**
 * @swagger
 * tags:
 *   name: Billing
 *   description: POS invoicing and customer management
 */

// ── Invoices ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /billing/invoices:
 *   post:
 *     summary: Create a POS invoice (ACID transaction)
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInvoiceRequest'
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error or insufficient stock
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Store, product, or inventory not found
 */
router.post(
  '/invoices',
  requireRole('CASHIER', 'STORE_ADMIN', 'SUPER_ADMIN'),
  createInvoiceValidator,
  validate,
  controller.createInvoice
);

/**
 * @swagger
 * /billing/invoices:
 *   get:
 *     summary: List invoices with filters
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [COMPLETED, CANCELLED, PARTIALLY_RETURNED, FULLY_RETURNED] }
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
 *         description: Paginated list of invoices
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get(
  '/invoices',
  requireRole('CASHIER', 'STORE_ADMIN', 'SUPER_ADMIN'),
  listInvoicesValidator,
  validate,
  controller.getAllInvoices
);

/**
 * @swagger
 * /billing/invoices/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Invoice MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Invoice details
 *       404:
 *         description: Invoice not found
 */
router.get(
  '/invoices/:id',
  requireRole('CASHIER', 'STORE_ADMIN', 'SUPER_ADMIN'),
  controller.getInvoiceById
);

/**
 * @swagger
 * /billing/invoices/{id}/cancel:
 *   patch:
 *     summary: Cancel an invoice (restores stock)
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Invoice cancelled successfully
 *       400:
 *         description: Invoice cannot be cancelled (already cancelled/returned)
 *       403:
 *         description: Forbidden — requires Store Admin or Super Admin
 *       404:
 *         description: Invoice not found
 */
router.patch(
  '/invoices/:id/cancel',
  requireRole('CASHIER', 'STORE_ADMIN', 'SUPER_ADMIN'),
  controller.cancelInvoice
);

// ── Customers ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /billing/customers:
 *   post:
 *     summary: Upsert customer by phone number (create or update)
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone]
 *             properties:
 *               name: { type: string, example: Priya Sharma }
 *               phone: { type: string, example: "9876543210" }
 *               email: { type: string, format: email }
 *               address: { type: string }
 *     responses:
 *       201:
 *         description: Customer created or updated
 */
router.post(
  '/customers',
  requireRole('CASHIER', 'STORE_ADMIN', 'SUPER_ADMIN'),
  upsertCustomerValidator,
  validate,
  controller.upsertCustomer
);

/**
 * @swagger
 * /billing/customers:
 *   get:
 *     summary: List all customers
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name or phone
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated customer list
 */
router.get('/customers', requireRole('STORE_ADMIN', 'SUPER_ADMIN'), controller.getAllCustomers);

/**
 * @swagger
 * /billing/customers/{id}:
 *   get:
 *     summary: Get customer by ID with invoice history
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Customer profile with invoice history
 *       404:
 *         description: Customer not found
 */
router.get(
  '/customers/:id',
  requireRole('CASHIER', 'STORE_ADMIN', 'SUPER_ADMIN'),
  controller.getCustomerById
);

module.exports = router;
