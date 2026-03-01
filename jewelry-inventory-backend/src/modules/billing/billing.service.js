const { prisma } = require('../../database/prisma/client');
const pricingService = require('./pricing.service');
const { NotFoundError, InsufficientStockError, BusinessLogicError } = require('../../common/constants/errors');

/**
 * Billing Service — creates invoices inside ACID transactions
 *
 * Request shape:
 * {
 *   storeId: string,
 *   cashierId: string,          // set from req.user.id
 *   goldRatePerGram: number,    // live gold rate
 *   paymentMethod: 'CASH'|'CARD'|'UPI'|'MIXED',
 *   customer?: { name, phone, email?, address? },
 *   customerId?: string,        // if existing customer
 *   items: [
 *     {
 *       productId: string,
 *       actualWeight: number,
 *       stoneWeight?: number,
 *       stoneCount?: number,
 *     }
 *   ]
 * }
 */
class BillingService {
  /**
   * Generate a unique invoice number
   */
  async generateInvoiceNumber(storeCode) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const prefix = `INV-${storeCode}-${dateStr}`;

    // Count existing invoices with this prefix today
    const count = await prisma.invoice.count({
      where: { invoiceNumber: { startsWith: prefix } },
    });
    const seq = String(count + 1).padStart(4, '0');
    return `${prefix}-${seq}`;
  }

  /**
   * Generate RFID for an invoice item
   */
  generateRfid(invoiceNumber, itemIndex) {
    return `RFID-${invoiceNumber}-${String(itemIndex + 1).padStart(3, '0')}`;
  }

  /**
   * Create an invoice — the core ACID transaction
   */
  async createInvoice(data) {
    const {
      storeId,
      cashierId,
      goldRatePerGram,
      paymentMethod,
      customerId,
      customer: customerData,
      items,
    } = data;

    return prisma.$transaction(async tx => {
      // 1. Validate store
      const store = await tx.store.findUnique({ where: { id: storeId } });
      if (!store || !store.isActive) throw new NotFoundError('Store');

      // 2. Handle customer (optional)
      let resolvedCustomerId = customerId || null;
      if (!resolvedCustomerId && customerData?.phone) {
        const existing = await tx.customer.findUnique({ where: { phone: customerData.phone } });
        if (existing) {
          resolvedCustomerId = existing.id;
        } else {
          const newCustomer = await tx.customer.create({ data: customerData });
          resolvedCustomerId = newCustomer.id;
        }
      }

      // 3. Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(store.code);

      // 4. Process each item
      let invoiceSubtotal = 0;
      let invoiceTotalGst = 0;
      const itemsToCreate = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const { productId, actualWeight, stoneWeight = 0, stoneCount = 0 } = item;

        // Load product
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product || !product.isActive) throw new NotFoundError(`Product ${productId}`);

        // Check & deduct store inventory
        const storeInv = await tx.storeInventory.findUnique({
          where: { storeId_productId: { storeId, productId } },
        });
        if (!storeInv) throw new NotFoundError(`No store inventory for product ${product.name}`);
        if (storeInv.availableWeight < actualWeight) {
          throw new InsufficientStockError(storeInv.availableWeight, actualWeight);
        }

        // Compute price
        const price = pricingService.calculateItemPrice(
          product,
          actualWeight,
          stoneWeight,
          stoneCount,
          goldRatePerGram
        );

        invoiceSubtotal += price.goldPrice + price.makingCharge;
        invoiceTotalGst += price.gstAmount;

        const rfid = this.generateRfid(invoiceNumber, i);

        itemsToCreate.push({
          productId,
          productName: product.name,
          sku: product.sku,
          purity: product.purity,
          hsnCode: product.hsnCode,
          allocatedWeight: storeInv.allocatedWeight / storeInv.allocatedStones || null,
          actualWeight,
          stoneCount,
          stoneWeight,
          netGoldWeight: price.netGoldWeight,
          ratePerGram: goldRatePerGram,
          goldPrice: price.goldPrice,
          makingCharge: price.makingCharge,
          gstRate: price.gstRate,
          gstAmount: price.gstAmount,
          totalAmount: price.totalAmount,
          rfid,
          isReturned: false,
        });

        // Deduct store inventory
        await tx.storeInventory.update({
          where: { storeId_productId: { storeId, productId } },
          data: {
            soldWeight: storeInv.soldWeight + actualWeight,
            availableWeight: storeInv.availableWeight - actualWeight,
            soldStones: storeInv.soldStones + stoneCount,
          },
        });

        // Write SALE ledger entry
        await tx.inventoryLedger.create({
          data: {
            type: 'SALE',
            productId,
            fromStoreId: storeId,
            weight: actualWeight,
            stoneCount,
            stoneWeight,
            netGoldWeight: price.netGoldWeight,
            reference: invoiceNumber,
            notes: `Sale — ${product.name}, RFID: ${rfid}`,
            performedBy: cashierId,
          },
        });

        // Also update central inventory sold weight
        await tx.centralInventory.update({
          where: { productId },
          data: {
            reservedWeight: { decrement: actualWeight },
          },
        });
      }

      const totalAmount = parseFloat((invoiceSubtotal + invoiceTotalGst).toFixed(2));

      // 5. Create invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          storeId,
          customerId: resolvedCustomerId,
          subtotal: parseFloat(invoiceSubtotal.toFixed(2)),
          gstAmount: parseFloat(invoiceTotalGst.toFixed(2)),
          totalAmount,
          paymentMethod,
          status: 'COMPLETED',
          cashierId,
          items: {
            create: itemsToCreate,
          },
        },
        include: {
          items: true,
          customer: true,
          store: { select: { id: true, name: true, code: true } },
        },
      });

      // 6. Write audit log
      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'Invoice',
          entityId: invoice.id,
          changes: { invoiceNumber, totalAmount, itemCount: items.length },
          userId: cashierId,
        },
      });

      return invoice;
    });
  }
}

module.exports = new BillingService();
