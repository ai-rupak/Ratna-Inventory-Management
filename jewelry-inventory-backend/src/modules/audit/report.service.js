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
        include: { product: { select: { id: true, name: true, sku: true, category: true, weightUnit: true, pricePerUnit: true } } },
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
        totalStones: item.totalStones,
        reservedStones: item.reservedStones,
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
  /**
   * Dashboard KPIs — global summary for SUPER_ADMIN home screen
   */
  async getDashboardKpis() {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalStores,
      totalProducts,
      totalCustomers,
      todaySales,
      monthSales,
      pendingRefunds,
      lowStockItems,
    ] = await Promise.all([
      prisma.store.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.customer.count(),

      // Today's invoices
      prisma.invoice.aggregate({
        where: { status: { not: 'CANCELLED' }, createdAt: { gte: startOfToday } },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),

      // This month's invoices
      prisma.invoice.aggregate({
        where: { status: { not: 'CANCELLED' }, createdAt: { gte: startOfMonth } },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),

      // Pending refund count
      prisma.refund.count({ where: { status: 'PENDING' } }),

      // Products with availableWeight <= 5 in central inventory
      prisma.centralInventory.count({ where: { availableWeight: { lte: 5 } } }),
    ]);

    return {
      stores: { total: totalStores },
      products: { total: totalProducts },
      customers: { total: totalCustomers },
      sales: {
        today: {
          invoiceCount: todaySales._count.id,
          revenue: todaySales._sum.totalAmount || 0,
        },
        thisMonth: {
          invoiceCount: monthSales._count.id,
          revenue: monthSales._sum.totalAmount || 0,
        },
      },
      alerts: {
        pendingRefunds,
        lowStockItems,
      },
    };
  }

  /**
   * Sales trend — day-by-day revenue breakdown for a date range
   * Returns an array suitable for charting
   */
  async getSalesTrend(filters = {}) {
    const from = filters.fromDate ? new Date(filters.fromDate) : (() => {
      const d = new Date(); d.setDate(d.getDate() - 29); d.setHours(0, 0, 0, 0); return d;
    })();
    const to = filters.toDate ? new Date(filters.toDate) : new Date();

    const where = {
      status: { not: 'CANCELLED' },
      createdAt: { gte: from, lte: to },
    };
    if (filters.storeId) where.storeId = filters.storeId;

    const invoices = await prisma.invoice.findMany({
      where,
      select: { createdAt: true, totalAmount: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const dayMap = {};
    for (const inv of invoices) {
      const day = inv.createdAt.toISOString().slice(0, 10);
      if (!dayMap[day]) dayMap[day] = { date: day, invoiceCount: 0, revenue: 0 };
      dayMap[day].invoiceCount += 1;
      dayMap[day].revenue += inv.totalAmount;
    }

    return Object.values(dayMap).map(d => ({
      ...d,
      revenue: parseFloat(d.revenue.toFixed(2)),
    }));
  }

  /**
   * Top-selling products — by total weight sold in a date range
   */
  async getTopProducts(filters = {}) {
    const where = {};
    if (filters.storeId) where.fromStoreId = filters.storeId;
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
      if (filters.toDate) where.createdAt.lte = new Date(filters.toDate);
    }
    where.type = 'SALE';

    const ledgerGroups = await prisma.inventoryLedger.groupBy({
      by: ['productId'],
      where,
      _sum: { weight: true, stoneCount: true },
      _count: { id: true },
      orderBy: { _sum: { weight: 'desc' } },
      take: filters.limit || 10,
    });

    const productIds = ledgerGroups.map(g => g.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true, pricePerUnit: true, weightUnit: true,
        category: { select: { name: true } } },
    });
    const productMap = Object.fromEntries(products.map(p => [p.id, p]));

    return ledgerGroups.map(g => ({
      product: productMap[g.productId] || { id: g.productId },
      totalWeightSold: g._sum.weight || 0,
      totalStonesSold: g._sum.stoneCount || 0,
      saleCount: g._count.id,
      estimatedRevenue: parseFloat(
        ((g._sum.weight || 0) * (productMap[g.productId]?.pricePerUnit || 0)).toFixed(2)
      ),
    }));
  }
}

module.exports = new ReportService();
