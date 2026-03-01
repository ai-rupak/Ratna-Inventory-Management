const { prisma } = require('../../database/prisma/client');
const { NotFoundError, ConflictError } = require('../../common/constants/errors');

/**
 * Customer Service — upsert and query customers
 */
class CustomerService {
  /**
   * Find or create a customer by phone number
   */
  async upsertCustomer(data) {
    const { name, phone, email, address } = data;

    const existing = await prisma.customer.findUnique({ where: { phone } });
    if (existing) {
      // Update name/email/address if provided
      return prisma.customer.update({
        where: { phone },
        data: {
          name: name || existing.name,
          email: email !== undefined ? email : existing.email,
          address: address !== undefined ? address : existing.address,
        },
      });
    }

    return prisma.customer.create({ data: { name, phone, email, address } });
  }

  async getCustomerByPhone(phone) {
    const customer = await prisma.customer.findUnique({
      where: { phone },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, invoiceNumber: true, totalAmount: true, createdAt: true, status: true },
        },
      },
    });
    if (!customer) throw new NotFoundError('Customer');
    return customer;
  }

  async getCustomerById(id) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, invoiceNumber: true, totalAmount: true, createdAt: true, status: true },
        },
      },
    });
    if (!customer) throw new NotFoundError('Customer');
    return customer;
  }

  async getAllCustomers(page = 1, limit = 20, search) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const skip = (page - 1) * limit;
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}

module.exports = new CustomerService();
