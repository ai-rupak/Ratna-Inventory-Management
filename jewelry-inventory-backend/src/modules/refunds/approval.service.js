const { prisma } = require('../../database/prisma/client');
const refundService = require('./refund.service');
const { NotFoundError, BusinessLogicError } = require('../../common/constants/errors');

/**
 * Approval Service — approve or reject pending refunds
 */
class ApprovalService {
  async approveRefund(refundId, approvedBy, notes) {
    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
      include: { invoice: true },
    });
    if (!refund) throw new NotFoundError('Refund');
    if (refund.status !== 'PENDING') {
      throw new BusinessLogicError(`Refund is already ${refund.status}`);
    }

    // Load the invoice item for stock reversal
    const invoiceItem = await prisma.invoiceItem.findUnique({ where: { rfid: refund.rfid } });
    if (!invoiceItem) throw new NotFoundError('InvoiceItem for this refund');

    // Update refund to APPROVED first
    const updatedRefund = await prisma.refund.update({
      where: { id: refundId },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
        approvalNotes: notes,
      },
    });

    // Execute stock reversal
    await refundService._completeRefundStockReversal(updatedRefund, invoiceItem, approvedBy);

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'REFUND_APPROVED',
        entity: 'Refund',
        entityId: refundId,
        changes: { approvalNotes: notes },
        userId: approvedBy,
      },
    });

    return await prisma.refund.findUnique({
      where: { id: refundId },
      include: { invoice: { select: { invoiceNumber: true } } },
    });
  }

  async rejectRefund(refundId, rejectedBy, notes) {
    const refund = await prisma.refund.findUnique({ where: { id: refundId } });
    if (!refund) throw new NotFoundError('Refund');
    if (refund.status !== 'PENDING') {
      throw new BusinessLogicError(`Refund is already ${refund.status}`);
    }

    const updated = await prisma.refund.update({
      where: { id: refundId },
      data: {
        status: 'REJECTED',
        approvedBy: rejectedBy,
        approvedAt: new Date(),
        approvalNotes: notes || 'Rejected by manager',
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'REFUND_REJECTED',
        entity: 'Refund',
        entityId: refundId,
        changes: { notes },
        userId: rejectedBy,
      },
    });

    return updated;
  }
}

module.exports = new ApprovalService();
