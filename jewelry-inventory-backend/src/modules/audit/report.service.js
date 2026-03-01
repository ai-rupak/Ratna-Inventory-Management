const { prisma } = require('../../database/prisma/client');

/**
 * Report Service — aggregation queries for dashboards and exports
 */
class ReportService {
  /**
   * Sales report — totals grouped by store and/or date range
   */
  async getSalesReport(filters = {}) {
    const where = { status: { not: 'CANCELLED' } };
    if (filters.storeId) where.storeId = filters.storeId;
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
      if (filters.toDate) where.createdAt.lte = new Date(filters.toDate);
    }

    const [invoiceSummary, byStore, byPaymentMethod] = await Promise.all([
      // Overall totals
      prisma.invoice.aggregate({
        where,
        _sum: { subtotal: true, gstAmount: true, totalAmount: true },
        _count: { id: true },
      }),

      // Group by store
      prisma.invoice.groupBy({
        by: ['storeId'],
        where,
        _sum: { totalAmount: true, gstAmount: true },
        _count: { id: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
      }),

      // Group by payment method
      prisma.invoice.groupBy({
        by: ['paymentMethod'],
        where,
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
    ]);

    // Enrich store data with names
    const storeIds = byStore.map(s => s.storeId);
    const stores = await prisma.store.findMany({
      where: { id: { in: storeIds } },
      select: { id: true, name: true, code: true },
    });
    const storeMap = Object.fromEntries(stores.map(s => [s.id, s]));

    return {
      summary: {
        totalInvoices: invoiceSummary._count.id,
        totalSales: invoiceSummary._sum.totalAmount || 0,
        totalGst: invoiceSummary._sum.gstAmount || 0,
        totalSubtotal: invoiceSummary._sum.subtotal || 0,
      },
      byStore: byStore.map(s => ({
        store: storeMap[s.storeId],
        invoiceCount: s._count.id,
        totalSales: s._sum.totalAmount || 0,
        totalGst: s._sum.gstAmount || 0,
      })),
      byPaymentMethod: byPaymentMethod.map(p => ({
        method: p.paymentMethod,
        count: p._count.id,
        total: p._sum.totalAmount || 0,
      })),
    };
  }

  /**
   * Inventory snapshot — current state of all central and store inventories
   */
  async getInventoryReport() {
    const [central, storeGroups] = await Promise.all([
      prisma.centralInventory.findMany({
        include: { product: { select: { id: true, name: true, sku: true, category: true, purity: true } } },
        orderBy: { updatedAt: 'desc' },
      }),

      prisma.storeInventory.groupBy({
        by: ['productId'],
        _sum: {
          allocatedWeight: true,
          soldWeight: true,
          availableWeight: true,
          returnedWeight: true,
        },
      }),
    ]);

    const storeGroupMap = Object.fromEntries(storeGroups.map(g => [g.productId, g._sum]));

    return central.map(item => ({
      product: item.product,
      central: {
        totalWeight: item.totalWeight,
        availableWeight: item.availableWeight,
        reservedWeight: item.reservedWeight,
        netGoldWeight: item.netGoldWeight,
      },
      storeAggregated: storeGroupMap[item.productId] || {
        allocatedWeight: 0,
        soldWeight: 0,
        availableWeight: 0,
        returnedWeight: 0,
      },
    }));
  }

  /**
   * Store summary — single store dashboard data
   */
  async getStoreSummary(storeId, fromDate, toDate) {
    const dateFilter = {};
    if (fromDate || toDate) {
      dateFilter.createdAt = {};
      if (fromDate) dateFilter.createdAt.gte = new Date(fromDate);
      if (toDate) dateFilter.createdAt.lte = new Date(toDate);
    }

    const [store, invoiceSummary, refundSummary, inventory, recentInvoices] = await Promise.all([
      prisma.store.findUnique({
        where: { id: storeId },
        include: {
          _count: { select: { users: true } },
        },
      }),

      prisma.invoice.aggregate({
        where: { storeId, status: { not: 'CANCELLED' }, ...dateFilter },
        _sum: { totalAmount: true, gstAmount: true },
        _count: { id: true },
      }),

      prisma.refund.aggregate({
        where: {
          invoice: { storeId },
          status: 'COMPLETED',
          ...dateFilter,
        },
        _sum: { refundAmount: true },
        _count: { id: true },
      }),

      prisma.storeInventory.findMany({
        where: { storeId },
        include: { product: { select: { name: true, sku: true, category: true } } },
        orderBy: { availableWeight: 'desc' },
        take: 10,
      }),

      prisma.invoice.findMany({
        where: { storeId, ...dateFilter },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          invoiceNumber: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          customer: { select: { name: true, phone: true } },
        },
      }),
    ]);

    if (!store) throw new Error('Store not found');

    return {
      store: {
        id: store.id,
        name: store.name,
        code: store.code,
        city: store.city,
        userCount: store._count.users,
      },
      sales: {
        invoiceCount: invoiceSummary._count.id,
        totalSales: invoiceSummary._sum.totalAmount || 0,
        totalGst: invoiceSummary._sum.gstAmount || 0,
      },
      refunds: {
        refundCount: refundSummary._count.id,
        totalRefunded: refundSummary._sum.refundAmount || 0,
      },
      topInventory: inventory,
      recentInvoices,
    };
  }
}

module.exports = new ReportService();
