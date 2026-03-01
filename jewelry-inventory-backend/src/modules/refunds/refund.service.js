const { prisma } = require('../../database/prisma/client');
const pricingService = require('../billing/pricing.service');
const { NotFoundError, BusinessLogicError } = require('../../common/constants/errors');

const WEIGHT_TOLERANCE = parseFloat(process.env.WEIGHT_TOLERANCE_GRAMS || '0.01');

/**
 * Refund Service — initiates refund by RFID lookup
 */
class RefundService {
  /**
   * Generate unique refund number
   */
  async generateRefundNumber(storeCode) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `REF-${storeCode}-${dateStr}`;
    const count = await prisma.refund.count({ where: { refundNumber: { startsWith: prefix } } });
    const seq = String(count + 1).padStart(4, '0');
    return `${prefix}-${seq}`;
  }

  /**
   * Initiate a refund by RFID
   * @param {Object} data
   * @param {string} data.rfid          - RFID of the item being returned
   * @param {number} data.returnedWeight - measured weight at return
   * @param {string} [data.reason]
   * @param {string} data.createdBy      - userId
   */
  async initiateRefund(data) {
    const { rfid, returnedWeight, reason, createdBy } = data;

    // 1. Find the invoice item by RFID
    const invoiceItem = await prisma.invoiceItem.findUnique({
      where: { rfid },
      include: {
        invoice: {
          include: {
            store: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    if (!invoiceItem) throw new NotFoundError(`No invoice item found with RFID: ${rfid}`);
    if (invoiceItem.isReturned) {
      throw new BusinessLogicError('This item has already been returned');
    }
    if (invoiceItem.invoice.status === 'CANCELLED') {
      throw new BusinessLogicError('Cannot refund an item from a cancelled invoice');
    }

    // 2. Check for existing pending refund for this RFID
    const existingRefund = await prisma.refund.findFirst({
      where: { rfid, status: { in: ['PENDING', 'APPROVED'] } },
    });
    if (existingRefund) {
      throw new BusinessLogicError('A refund is already in progress for this item');
    }

    // 3. Weight tolerance check
    const deviation = Math.abs(returnedWeight - invoiceItem.actualWeight);
    const isWithinTolerance = deviation <= WEIGHT_TOLERANCE;

    // 4. Compute refund amount using original price snapshot
    const refundAmount = pricingService.calculateRefundAmount(invoiceItem, returnedWeight);

    const storeCode = invoiceItem.invoice.store.code;
    const refundNumber = await this.generateRefundNumber(storeCode);

    // 5. Create refund record
    // Auto-approve if within tolerance
    const status = isWithinTolerance ? 'APPROVED' : 'PENDING';

    const refund = await prisma.refund.create({
      data: {
        refundNumber,
        invoiceId: invoiceItem.invoiceId,
        rfid,
        returnedWeight,
        actualWeight: invoiceItem.actualWeight,
        weightDeviation: parseFloat(deviation.toFixed(4)),
        refundAmount: parseFloat(refundAmount.toFixed(2)),
        status,
        reason,
        createdBy,
        approvedBy: isWithinTolerance ? createdBy : null,
        approvedAt: isWithinTolerance ? new Date() : null,
      },
      include: { invoice: true },
    });

    // 6. If auto-approved, complete the stock reversal immediately
    if (isWithinTolerance) {
      await this._completeRefundStockReversal(refund, invoiceItem, createdBy);
    }

    return {
      ...refund,
      isAutoApproved: isWithinTolerance,
      weightTolerance: WEIGHT_TOLERANCE,
    };
  }

  /**
   * Internal — reverse stock after refund approval
   */
  async _completeRefundStockReversal(refund, invoiceItem, approvedBy) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: refund.invoiceId },
      include: { items: true },
    });

    return prisma.$transaction(async tx => {
      // Restore store inventory
      const storeInv = await tx.storeInventory.findUnique({
        where: {
          storeId_productId: {
            storeId: invoice.storeId,
            productId: invoiceItem.productId,
          },
        },
      });
      if (storeInv) {
        await tx.storeInventory.update({
          where: {
            storeId_productId: {
              storeId: invoice.storeId,
              productId: invoiceItem.productId,
            },
          },
          data: {
            returnedWeight: storeInv.returnedWeight + refund.returnedWeight,
            availableWeight: storeInv.availableWeight + refund.returnedWeight,
            returnedStones: storeInv.returnedStones + invoiceItem.stoneCount,
          },
        });
      }

      // Write REFUND ledger entry
      await tx.inventoryLedger.create({
        data: {
          type: 'REFUND',
          productId: invoiceItem.productId,
          toStoreId: invoice.storeId,
          weight: refund.returnedWeight,
          stoneCount: invoiceItem.stoneCount,
          stoneWeight: invoiceItem.stoneWeight,
          netGoldWeight: refund.returnedWeight - invoiceItem.stoneWeight,
          reference: refund.refundNumber,
          invoiceId: invoice.id,
          refundId: refund.id,
          notes: `Refund — RFID: ${refund.rfid}`,
          performedBy: approvedBy,
        },
      });

      // Mark invoice item as returned
      await tx.invoiceItem.update({
        where: { rfid: refund.rfid },
        data: { isReturned: true },
      });

      // Update invoice status
      const allItems = invoice.items;
      const returnedCount = allItems.filter(i => i.isReturned || i.rfid === refund.rfid).length;
      const newStatus =
        returnedCount === allItems.length ? 'FULLY_RETURNED' : 'PARTIALLY_RETURNED';

      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: newStatus },
      });

      // Mark refund completed
      await tx.refund.update({
        where: { id: refund.id },
        data: { status: 'COMPLETED' },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          action: 'REFUND_COMPLETED',
          entity: 'Refund',
          entityId: refund.id,
          changes: { refundNumber: refund.refundNumber, refundAmount: refund.refundAmount },
          userId: approvedBy,
        },
      });
    });
  }

  async getRefundById(id) {
    const refund = await prisma.refund.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            store: { select: { id: true, name: true, code: true } },
            items: true,
          },
        },
      },
    });
    if (!refund) throw new NotFoundError('Refund');
    return refund;
  }

  async getAllRefunds(filters = {}, page = 1, limit = 20) {
    const where = {};
    if (filters.invoiceId) where.invoiceId = filters.invoiceId;
    if (filters.status) where.status = filters.status;
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
      if (filters.toDate) where.createdAt.lte = new Date(filters.toDate);
    }

    const skip = (page - 1) * limit;
    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({
        where,
        include: {
          invoice: {
            include: { store: { select: { id: true, name: true, code: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.refund.count({ where }),
    ]);

    return {
      data: refunds,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}

module.exports = new RefundService();
