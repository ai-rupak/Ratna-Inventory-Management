const { prisma } = require('../../database/prisma/client');
const { NotFoundError, BusinessLogicError } = require('../../common/constants/errors');

/**
 * Central Inventory Service - Manages the master/central stock
 */
class CentralInventoryService {
  /**
   * Receive new stock into central inventory for a product.
   * Creates the CentralInventory record if it doesn't exist yet.
   */
  async receiveStock(data) {
    const { productId, totalWeight, totalStones = 0, stoneWeight = 0, notes, performedBy } = data;

    // Verify product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundError('Product');

    const netGoldWeight = totalWeight - stoneWeight;

    // Upsert CentralInventory
    const existing = await prisma.centralInventory.findUnique({ where: { productId } });

    let centralInventory;
    if (existing) {
      centralInventory = await prisma.centralInventory.update({
        where: { productId },
        data: {
          totalWeight: existing.totalWeight + totalWeight,
          availableWeight: existing.availableWeight + totalWeight,
          totalStones: existing.totalStones + totalStones,
          stoneWeight: existing.stoneWeight + stoneWeight,
          netGoldWeight: existing.netGoldWeight + netGoldWeight,
        },
        include: { product: true },
      });
    } else {
      centralInventory = await prisma.centralInventory.create({
        data: {
          productId,
          totalWeight,
          availableWeight: totalWeight,
          reservedWeight: 0,
          totalStones,
          reservedStones: 0,
          stoneWeight,
          netGoldWeight,
        },
        include: { product: true },
      });
    }

    // Write ledger entry
    await prisma.inventoryLedger.create({
      data: {
        type: 'ALLOCATION',
        productId,
        weight: totalWeight,
        stoneCount: totalStones,
        stoneWeight,
        netGoldWeight,
        reference: `STOCK_RECEIVE_${Date.now()}`,
        notes: notes || 'Stock received into central inventory',
        performedBy,
      },
    });

    return centralInventory;
  }

  /**
   * List all central inventory records with pagination
   */
  async getAllCentralInventory(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.centralInventory.findMany({
        include: { product: true },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.centralInventory.count(),
    ]);

    return {
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
   * Get central inventory for a single product
   */
  async getCentralInventoryByProduct(productId) {
    const item = await prisma.centralInventory.findUnique({
      where: { productId },
      include: { product: true },
    });
    if (!item) throw new NotFoundError('CentralInventory');
    return item;
  }

  /**
   * Adjust stock (manual correction, positive or negative delta)
   */
  async adjustStock(productId, weightDelta, notes, performedBy) {
    const existing = await prisma.centralInventory.findUnique({ where: { productId } });
    if (!existing) throw new NotFoundError('CentralInventory');

    const newAvailable = existing.availableWeight + weightDelta;
    if (newAvailable < 0) throw new BusinessLogicError('Adjustment would result in negative available stock');

    const updated = await prisma.centralInventory.update({
      where: { productId },
      data: {
        totalWeight: existing.totalWeight + weightDelta,
        availableWeight: newAvailable,
        netGoldWeight: existing.netGoldWeight + weightDelta,
      },
    });

    await prisma.inventoryLedger.create({
      data: {
        type: 'ADJUSTMENT',
        productId,
        weight: Math.abs(weightDelta),
        stoneCount: 0,
        stoneWeight: 0,
        netGoldWeight: Math.abs(weightDelta),
        reference: `ADJ_${Date.now()}`,
        notes: notes || 'Manual stock adjustment',
        performedBy,
      },
    });

    return updated;
  }
}

module.exports = new CentralInventoryService();
