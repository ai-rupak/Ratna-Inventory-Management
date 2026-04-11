const refundService = require('./refund.service');
const approvalService = require('./approval.service');
const { successResponse, paginatedResponse } = require('../../common/utils/response.util');

class RefundsController {
  async initiateRefund(req, res, next) {
    try {
      const refund = await refundService.initiateRefund({
        ...req.body,
        createdBy: req.user.id,
      });
      successResponse(res, refund, 'Refund initiated successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async getAllRefunds(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const filters = {
        invoiceId: req.query.invoiceId,
        status: req.query.status,
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
      };

      // STORE_ADMIN and CASHIER can only see their store's refunds
      if (req.user.role !== 'SUPER_ADMIN') {
        filters.storeId = req.user.storeId;
      }
      const result = await refundService.getAllRefunds(filters, page, limit);
      paginatedResponse(res, result.data, result.pagination, 'Refunds retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getRefundById(req, res, next) {
    try {
      const refund = await refundService.getRefundById(req.params.id);
      successResponse(res, refund, 'Refund retrieved');
    } catch (err) {
      next(err);
    }
  }

  async approveRefund(req, res, next) {
    try {
      if (req.user.role !== 'SUPER_ADMIN') {
        const existingRefund = await refundService.getRefundById(req.params.id);
        if (existingRefund.invoice.storeId !== req.user.storeId) {
          return res.status(403).json({ success: false, error: 'Access denied: Refund belongs to another store' });
        }
      }

      const refund = await approvalService.approveRefund(
        req.params.id,
        req.user.id,
        req.body.notes
      );
      successResponse(res, refund, 'Refund approved and stock reversed');
    } catch (err) {
      next(err);
    }
  }

  async rejectRefund(req, res, next) {
    try {
      if (req.user.role !== 'SUPER_ADMIN') {
        const existingRefund = await refundService.getRefundById(req.params.id);
        if (existingRefund.invoice.storeId !== req.user.storeId) {
          return res.status(403).json({ success: false, error: 'Access denied: Refund belongs to another store' });
        }
      }

      const refund = await approvalService.rejectRefund(
        req.params.id,
        req.user.id,
        req.body.notes
      );
      successResponse(res, refund, 'Refund rejected');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RefundsController();
