const { prisma } = require('../../database/prisma/client');
const { NotFoundError, BusinessLogicError } = require('../../common/constants/errors');

/**
 * Invoice Service — queries and lifecycle management for invoices
 */
class InvoiceService {
  async getInvoiceById(id) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        customer: true,
        store: { select: { id: true, name: true, code: true } },
        refunds: true,
      },
    });
    if (!invoice) throw new NotFoundError('Invoice');
    return invoice;
  }

  async getInvoiceByNumber(invoiceNumber) {
    const invoice = await prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: {
        items: true,
        customer: true,
        store: { select: { id: true, name: true, code: true } },
      },
    });
    if (!invoice) throw new NotFoundError('Invoice');
    return invoice;
  }

  async getAllInvoices(filters = {}, page = 1, limit = 20) {
    const where = {};
    if (filters.storeId) where.storeId = filters.storeId;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.status) where.status = filters.status;
    if (filters.cashierId) where.cashierId = filters.cashierId;
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
      if (filters.toDate) where.createdAt.lte = new Date(filters.toDate);
    }

    const skip = (page - 1) * limit;
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          store: { select: { id: true, name: true, code: true } },
          _count: { select: { items: true, refunds: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Cancel a COMPLETED invoice (only allowed if no items are returned)
   */
  async cancelInvoice(id, cancelledBy) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!invoice) throw new NotFoundError('Invoice');
    if (invoice.status !== 'COMPLETED') {
      throw new BusinessLogicError(`Cannot cancel an invoice with status: ${invoice.status}`);
    }
    const hasReturns = invoice.items.some(item => item.isReturned);
    if (hasReturns) {
      throw new BusinessLogicError('Cannot cancel an invoice with returned items');
    }

    return prisma.$transaction(async tx => {
      // Restore store inventory for each item
      for (const item of invoice.items) {
        const storeInv = await tx.storeInventory.findUnique({
          where: { storeId_productId: { storeId: invoice.storeId, productId: item.productId } },
        });
        if (storeInv) {
          await tx.storeInventory.update({
            where: { storeId_productId: { storeId: invoice.storeId, productId: item.productId } },
            data: {
              soldWeight: storeInv.soldWeight - item.actualWeight,
              availableWeight: storeInv.availableWeight + item.actualWeight,
              soldStones: storeInv.soldStones - item.stoneCount,
            },
          });
        }
      }

      const updated = await tx.invoice.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      await tx.auditLog.create({
        data: {
          action: 'CANCEL',
          entity: 'Invoice',
          entityId: id,
          changes: { previousStatus: 'COMPLETED', newStatus: 'CANCELLED' },
          userId: cancelledBy,
        },
      });

      return updated;
    });
  }
}

module.exports = new InvoiceService();
