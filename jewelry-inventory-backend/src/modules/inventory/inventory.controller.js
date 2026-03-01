const centralInventoryService = require('./central-inventory.service');
const storeInventoryService = require('./store-inventory.service');
const allocationService = require('./allocation.service');
const ledgerService = require('./ledger.service');
const { successResponse, paginatedResponse } = require('../../common/utils/response.util');

class InventoryController {
  // ── Central Inventory ──────────────────────────────────────

  async receiveStock(req, res, next) {
    try {
      const result = await centralInventoryService.receiveStock({
        ...req.body,
        performedBy: req.user.id,
      });
      successResponse(res, result, 'Stock received successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async getAllCentralInventory(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const result = await centralInventoryService.getAllCentralInventory(page, limit);
      paginatedResponse(res, result.data, result.pagination, 'Central inventory retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getCentralInventoryByProduct(req, res, next) {
    try {
      const result = await centralInventoryService.getCentralInventoryByProduct(req.params.productId);
      successResponse(res, result, 'Central inventory retrieved');
    } catch (err) {
      next(err);
    }
  }

  async adjustStock(req, res, next) {
    try {
      const result = await centralInventoryService.adjustStock(
        req.params.productId,
        req.body.weightDelta,
        req.body.notes,
        req.user.id
      );
      successResponse(res, result, 'Stock adjusted successfully');
    } catch (err) {
      next(err);
    }
  }

  // ── Allocation ─────────────────────────────────────────────

  async allocate(req, res, next) {
    try {
      const result = await allocationService.allocate({
        ...req.body,
        performedBy: req.user.id,
      });
      successResponse(res, result, 'Stock allocated successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async transfer(req, res, next) {
    try {
      const result = await allocationService.transfer(
        req.body.fromStoreId,
        req.body.toStoreId,
        req.body.productId,
        req.body.weight,
        req.user.id
      );
      successResponse(res, result, 'Stock transferred successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  // ── Store Inventory ────────────────────────────────────────

  async getStoreInventory(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const result = await storeInventoryService.getStoreInventory(req.params.storeId, page, limit);
      paginatedResponse(res, result.data, result.pagination, 'Store inventory retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getInventorySummary(req, res, next) {
    try {
      const result = await storeInventoryService.getInventorySummary();
      successResponse(res, result, 'Inventory summary retrieved');
    } catch (err) {
      next(err);
    }
  }

  // ── Ledger ─────────────────────────────────────────────────

  async getLedger(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const filters = {
        type: req.query.type,
        productId: req.query.productId,
        storeId: req.query.storeId,
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
      };
      const result = await ledgerService.getLedgerEntries(filters, page, limit);
      paginatedResponse(res, result.data, result.pagination, 'Ledger entries retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getLedgerSummary(req, res, next) {
    try {
      const result = await ledgerService.getLedgerSummary(req.query.productId);
      successResponse(res, result, 'Ledger summary retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new InventoryController();
