const { prisma } = require('../../database/prisma/client');
const { NotFoundError } = require('../../common/constants/errors');

/**
 * Store Inventory Service — queries stock at store level
 */
class StoreInventoryService {
  /**
   * Get all inventory items for a store with pagination
   */
  async getStoreInventory(storeId, page = 1, limit = 20) {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundError('Store');

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.storeInventory.findMany({
        where: { storeId },
        include: { product: true },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.storeInventory.count({ where: { storeId } }),
    ]);

    return {
      store: { id: store.id, name: store.name, code: store.code },
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a specific product's stock at a specific store
   */
  async getStoreProductInventory(storeId, productId) {
    const item = await prisma.storeInventory.findUnique({
      where: { storeId_productId: { storeId, productId } },
      include: { product: true, store: true },
    });
    if (!item) throw new NotFoundError('StoreInventory');
    return item;
  }

  /**
   * Get inventory summary across all stores for SUPER_ADMIN
   */
  async getInventorySummary() {
    const summary = await prisma.storeInventory.groupBy({
      by: ['storeId'],
      _sum: {
        allocatedWeight: true,
        soldWeight: true,
        availableWeight: true,
        returnedWeight: true,
      },
      _count: { id: true },
    });

    // Enrich with store info
    const storeIds = summary.map(s => s.storeId);
    const stores = await prisma.store.findMany({
      where: { id: { in: storeIds } },
      select: { id: true, name: true, code: true },
    });
    const storeMap = Object.fromEntries(stores.map(s => [s.id, s]));

    return summary.map(item => ({
      store: storeMap[item.storeId],
      totalAllocatedWeight: item._sum.allocatedWeight,
      totalSoldWeight: item._sum.soldWeight,
      totalAvailableWeight: item._sum.availableWeight,
      totalReturnedWeight: item._sum.returnedWeight,
      productCount: item._count.id,
    }));
  }
}

module.exports = new StoreInventoryService();
