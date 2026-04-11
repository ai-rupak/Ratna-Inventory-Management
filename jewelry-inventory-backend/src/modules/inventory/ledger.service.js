const { prisma } = require('../../database/prisma/client');

/**
 * Ledger Service — read-only queries on the InventoryLedger
 * Write operations are performed directly by allocation/billing/refund services
 * inside their transactions.
 */
class LedgerService {
  /**
   * Query ledger entries with filters and pagination
   */
  async getLedgerEntries(filters = {}, page = 1, limit = 20) {
    const where = {};

    if (filters.type) where.type = filters.type;
    if (filters.productId) where.productId = filters.productId;
    if (filters.storeId) {
      where.OR = [{ fromStoreId: filters.storeId }, { toStoreId: filters.storeId }];
    }
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
      if (filters.toDate) where.createdAt.lte = new Date(filters.toDate);
    }

    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      prisma.inventoryLedger.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.inventoryLedger.count({ where }),
    ]);

    return {
      data: entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get ledger summary (total weight moved per type)
   */
  async getLedgerSummary(productId) {
    const where = productId ? { productId } : {};
    const summary = await prisma.inventoryLedger.groupBy({
      by: ['type'],
      where,
      _sum: { weight: true, stoneCount: true },
      _count: { id: true },
    });
    return summary;
  }
}

module.exports = new LedgerService();
