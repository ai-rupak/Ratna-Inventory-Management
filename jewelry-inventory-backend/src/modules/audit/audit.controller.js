const auditLogService = require('./audit-log.service');
const reportService = require('./report.service');
const { successResponse, paginatedResponse } = require('../../common/utils/response.util');

class AuditController {
  // ── Audit Logs ─────────────────────────────────────────────

  async getAuditLogs(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const filters = {
        entity: req.query.entity,
        entityId: req.query.entityId,
        userId: req.query.userId,
        action: req.query.action,
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
      };
      const result = await auditLogService.getAuditLogs(filters, page, limit);
      paginatedResponse(res, result.data, result.pagination, 'Audit logs retrieved');
    } catch (err) {
      next(err);
    }
  }

  // ── Reports ────────────────────────────────────────────────

  async getSalesReport(req, res, next) {
    try {
      const filters = {
        storeId: req.query.storeId,
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
      };

      // STORE_ADMIN and CASHIER can only see their store
      if (req.user.role !== 'SUPER_ADMIN') {
        filters.storeId = req.user.storeId;
      }

      const report = await reportService.getSalesReport(filters);
      successResponse(res, report, 'Sales report generated');
    } catch (err) {
      next(err);
    }
  }

  async getInventoryReport(req, res, next) {
    try {
      const report = await reportService.getInventoryReport();
      successResponse(res, report, 'Inventory report generated');
    } catch (err) {
      next(err);
    }
  }

  async getStoreSummary(req, res, next) {
    try {
      const { storeId } = req.params;

      // STORE_ADMIN and CASHIER can only see their own store
      if (req.user.role !== 'SUPER_ADMIN' && req.user.storeId !== storeId) {
        return res.status(403).json({ success: false, error: 'Access denied to this store' });
      }

      const report = await reportService.getStoreSummary(
        storeId,
        req.query.fromDate,
        req.query.toDate
      );
      successResponse(res, report, 'Store summary generated');
    } catch (err) {
      next(err);
    }
  }

  async getDashboardKpis(req, res, next) {
    try {
      const kpis = await reportService.getDashboardKpis();
      successResponse(res, kpis, 'Dashboard KPIs retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getSalesTrend(req, res, next) {
    try {
      const filters = {
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
        storeId: req.query.storeId,
      };

      // STORE_ADMIN and CASHIER scoped to their store
      if (req.user.role !== 'SUPER_ADMIN') {
        filters.storeId = req.user.storeId;
      }

      const trend = await reportService.getSalesTrend(filters);
      successResponse(res, trend, 'Sales trend retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getTopProducts(req, res, next) {
    try {
      const filters = {
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
        storeId: req.query.storeId,
        limit: parseInt(req.query.limit, 10) || 10,
      };

      // STORE_ADMIN and CASHIER scoped to their store
      if (req.user.role !== 'SUPER_ADMIN') {
        filters.storeId = req.user.storeId;
      }

      const products = await reportService.getTopProducts(filters);
      successResponse(res, products, 'Top products retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuditController();
