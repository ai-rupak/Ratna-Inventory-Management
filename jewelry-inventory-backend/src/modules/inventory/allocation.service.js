const { prisma } = require('../../database/prisma/client');
const { NotFoundError, InsufficientStockError } = require('../../common/constants/errors');

/**
 * Allocation Service — moves stock from Central Inventory → Store Inventory
 * All operations run inside a Prisma transaction to ensure atomicity.
 */
class AllocationService {
  /**
   * Allocate stock from central inventory to a store
   * @param {Object} data
   * @param {string} data.productId
   * @param {string} data.storeId
   * @param {number} data.weight        - gross weight to allocate
   * @param {number} [data.stoneCount]
   * @param {number} [data.stoneWeight]
   * @param {string} [data.notes]
   * @param {string} data.performedBy   - userId
   */
  async allocate(data) {
    const { productId, storeId, weight, stoneCount = 0, stoneWeight = 0, notes, performedBy } = data;

    return prisma.$transaction(async tx => {
      // 1. Lock & validate product
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new NotFoundError('Product');

      const store = await tx.store.findUnique({ where: { id: storeId } });
      if (!store) throw new NotFoundError('Store');

      // 2. Check central inventory has enough stock
      const central = await tx.centralInventory.findUnique({ where: { productId } });
      if (!central) throw new NotFoundError('CentralInventory — no stock received yet for this product');
      if (central.availableWeight < weight) {
        throw new InsufficientStockError(central.availableWeight, weight);
      }

      const netGoldWeight = weight - stoneWeight;

      // 3. Deduct from central inventory
      await tx.centralInventory.update({
        where: { productId },
        data: {
          reservedWeight: central.reservedWeight + weight,
          availableWeight: central.availableWeight - weight,
          reservedStones: central.reservedStones + stoneCount,
          netGoldWeight: central.netGoldWeight - netGoldWeight,
        },
      });

      // 4. Upsert store inventory
      const existingStore = await tx.storeInventory.findUnique({
        where: { storeId_productId: { storeId, productId } },
      });

      let storeInventory;
      if (existingStore) {
        storeInventory = await tx.storeInventory.update({
          where: { storeId_productId: { storeId, productId } },
          data: {
            allocatedWeight: existingStore.allocatedWeight + weight,
            availableWeight: existingStore.availableWeight + weight,
            allocatedStones: existingStore.allocatedStones + stoneCount,
            stoneWeight: existingStore.stoneWeight + stoneWeight,
            netGoldWeight: existingStore.netGoldWeight + netGoldWeight,
          },
          include: { product: true, store: true },
        });
      } else {
        storeInventory = await tx.storeInventory.create({
          data: {
            storeId,
            productId,
            allocatedWeight: weight,
            soldWeight: 0,
            returnedWeight: 0,
            availableWeight: weight,
            allocatedStones: stoneCount,
            soldStones: 0,
            returnedStones: 0,
            stoneWeight,
            netGoldWeight,
          },
          include: { product: true, store: true },
        });
      }

      // 5. Write ledger entry
      const reference = `ALLOC-${storeId.slice(-6)}-${Date.now()}`;
      await tx.inventoryLedger.create({
        data: {
          type: 'ALLOCATION',
          productId,
          toStoreId: storeId,
          weight,
          stoneCount,
          stoneWeight,
          netGoldWeight,
          reference,
          notes: notes || `Allocated ${weight}g to ${store.name}`,
          performedBy,
        },
      });

      return {
        allocation: storeInventory,
        ledgerReference: reference,
      };
    });
  }

  /**
   * Transfer stock between two stores (store → store via central)
   */
  async transfer(fromStoreId, toStoreId, productId, weight, performedBy) {
    return prisma.$transaction(async tx => {
      // Deduct from source store
      const fromInventory = await tx.storeInventory.findUnique({
        where: { storeId_productId: { storeId: fromStoreId, productId } },
      });
      if (!fromInventory) throw new NotFoundError('Source store inventory');
      if (fromInventory.availableWeight < weight) {
        throw new InsufficientStockError(fromInventory.availableWeight, weight);
      }

      const netGoldWeight = weight;

      await tx.storeInventory.update({
        where: { storeId_productId: { storeId: fromStoreId, productId } },
        data: {
          allocatedWeight: fromInventory.allocatedWeight - weight,
          availableWeight: fromInventory.availableWeight - weight,
          netGoldWeight: fromInventory.netGoldWeight - netGoldWeight,
        },
      });

      // Add to destination store
      const toInventory = await tx.storeInventory.findUnique({
        where: { storeId_productId: { storeId: toStoreId, productId } },
      });

      if (toInventory) {
        await tx.storeInventory.update({
          where: { storeId_productId: { storeId: toStoreId, productId } },
          data: {
            allocatedWeight: toInventory.allocatedWeight + weight,
            availableWeight: toInventory.availableWeight + weight,
            netGoldWeight: toInventory.netGoldWeight + netGoldWeight,
          },
        });
      } else {
        await tx.storeInventory.create({
          data: {
            storeId: toStoreId,
            productId,
            allocatedWeight: weight,
            availableWeight: weight,
            soldWeight: 0,
            returnedWeight: 0,
            allocatedStones: 0,
            soldStones: 0,
            returnedStones: 0,
            stoneWeight: 0,
            netGoldWeight,
          },
        });
      }

      const reference = `TRANSFER-${Date.now()}`;
      await tx.inventoryLedger.create({
        data: {
          type: 'ADJUSTMENT',
          productId,
          fromStoreId,
          toStoreId,
          weight,
          stoneCount: 0,
          stoneWeight: 0,
          netGoldWeight,
          reference,
          notes: `Inter-store transfer ${weight}g`,
          performedBy,
        },
      });

      return { reference };
    });
  }
}

module.exports = new AllocationService();
