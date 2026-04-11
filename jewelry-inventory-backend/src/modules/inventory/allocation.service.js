const { prisma } = require('../../database/prisma/client');
const { NotFoundError, InsufficientStockError } = require('../../common/constants/errors');

/**
 * Allocation Service — moves stock from Central Inventory → Store Inventory
 * Weight is expressed in RATI or CARAT as per the product's weightUnit.
 * All operations run inside a Prisma transaction to ensure atomicity.
 */
class AllocationService {
  /**
   * Allocate stock from central inventory to a store
   *
   * @param {Object} data
   * @param {string} data.productId
   * @param {string} data.storeId
   * @param {number} data.weight        - weight to allocate (in product's weightUnit: RATI or CARAT)
   * @param {number} [data.stoneCount]  - number of stones to allocate
   * @param {string} [data.notes]
   * @param {string} data.performedBy   - userId
   */
  async allocate(data) {
    const { productId, storeId, weight, stoneCount = 0, notes, performedBy } = data;

    return prisma.$transaction(async tx => {
      // 1. Validate product and store
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
      if (stoneCount > 0 && (central.totalStones - central.reservedStones) < stoneCount) {
        throw new InsufficientStockError(central.totalStones - central.reservedStones, stoneCount);
      }

      // 3. Deduct from central inventory
      await tx.centralInventory.update({
        where: { productId },
        data: {
          reservedWeight: central.reservedWeight + weight,
          availableWeight: central.availableWeight - weight,
          reservedStones: central.reservedStones + stoneCount,
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
          reference,
          notes: notes || `Allocated ${weight} ${product.weightUnit} to ${store.name}`,
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
   * Transfer stock between two stores
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

      await tx.storeInventory.update({
        where: { storeId_productId: { storeId: fromStoreId, productId } },
        data: {
          allocatedWeight: fromInventory.allocatedWeight - weight,
          availableWeight: fromInventory.availableWeight - weight,
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
          reference,
          notes: `Inter-store transfer — ${weight} units`,
          performedBy,
        },
      });

      return { reference };
    });
  }
}

module.exports = new AllocationService();
