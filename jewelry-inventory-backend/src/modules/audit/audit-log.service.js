const { prisma } = require('../../database/prisma/client');

/**
 * Audit Log Service — write and query AuditLog entries
 */
class AuditLogService {
  /**
   * Write a new audit log entry
   */
  async log({ action, entity, entityId, changes, userId, ipAddress, userAgent }) {
    return prisma.auditLog.create({
      data: { action, entity, entityId, changes, userId, ipAddress, userAgent },
    });
  }

  /**
   * Query audit logs with filters and pagination
   */
  async getAuditLogs(filters = {}, page = 1, limit = 20) {
    const where = {};
    if (filters.entity) where.entity = filters.entity;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
      if (filters.toDate) where.createdAt.lte = new Date(filters.toDate);
    }

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}

module.exports = new AuditLogService();
