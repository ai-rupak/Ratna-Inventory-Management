const billingService = require('./billing.service');
const invoiceService = require('./invoice.service');
const customerService = require('./customer.service');
const { successResponse, paginatedResponse } = require('../../common/utils/response.util');

class BillingController {
  // ── Invoices ───────────────────────────────────────────────

  async createInvoice(req, res, next) {
    try {
      const invoice = await billingService.createInvoice({
        ...req.body,
        cashierId: req.user.id,
      });
      successResponse(res, invoice, 'Invoice created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async getInvoiceById(req, res, next) {
    try {
      const invoice = await invoiceService.getInvoiceById(req.params.id);
      successResponse(res, invoice, 'Invoice retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getAllInvoices(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const filters = {
        storeId: req.query.storeId,
        customerId: req.query.customerId,
        status: req.query.status,
        cashierId: req.query.cashierId,
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
      };

      // STORE_ADMIN and CASHIER can only see their store's invoices
      if (req.user.role !== 'SUPER_ADMIN') {
        filters.storeId = req.user.storeId;
      }

      const result = await invoiceService.getAllInvoices(filters, page, limit);
      paginatedResponse(res, result.data, result.pagination, 'Invoices retrieved');
    } catch (err) {
      next(err);
    }
  }

  async cancelInvoice(req, res, next) {
    try {
      // Ensure STORE_ADMIN and CASHIER can only cancel their own store's invoices
      if (req.user.role !== 'SUPER_ADMIN') {
        const existingInvoice = await invoiceService.getInvoiceById(req.params.id);
        if (existingInvoice.storeId !== req.user.storeId) {
          return res.status(403).json({ success: false, error: 'Access denied: Invoice belongs to another store' });
        }
      }

      const invoice = await invoiceService.cancelInvoice(req.params.id, req.user.id);
      successResponse(res, invoice, 'Invoice cancelled');
    } catch (err) {
      next(err);
    }
  }

  // ── Customers ──────────────────────────────────────────────

  async upsertCustomer(req, res, next) {
    try {
      const customer = await customerService.upsertCustomer(req.body);
      successResponse(res, customer, 'Customer saved', 201);
    } catch (err) {
      next(err);
    }
  }

  async getAllCustomers(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const result = await customerService.getAllCustomers(page, limit, req.query.search);
      paginatedResponse(res, result.data, result.pagination, 'Customers retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getCustomerById(req, res, next) {
    try {
      const customer = await customerService.getCustomerById(req.params.id);
      successResponse(res, customer, 'Customer retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BillingController();
