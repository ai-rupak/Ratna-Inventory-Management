const { prisma } = require('../../database/prisma/client');
const { NotFoundError } = require('../../common/constants/errors');

/**
 * Gold Rate Service — manages live gold rates per purity
 */
class GoldRateService {
  /**
   * Set the gold rate for a given purity (creates a new historical record)
   */
  async setRate(purity, ratePerGram, setBy) {
    return prisma.goldRate.create({
      data: {
        purity,
        ratePerGram,
        setBy,
        effectiveFrom: new Date(),
      },
    });
  }

  /**
   * Get all rate history with pagination
   */
  async getAllRates(filters = {}, page = 1, limit = 20) {
    const where = {};
    if (filters.purity) where.purity = filters.purity;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.goldRate.findMany({
        where,
        orderBy: { effectiveFrom: 'desc' },
        skip,
        take: limit,
      }),
      prisma.goldRate.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get the latest rate for every purity (current rates snapshot)
   */
  async getCurrentRates() {
    const purities = ['24K', '22K', '18K', '14K'];
    const results = await Promise.all(
      purities.map(purity =>
        prisma.goldRate.findFirst({
          where: { purity },
          orderBy: { effectiveFrom: 'desc' },
        })
      )
    );
    return purities.reduce((acc, purity, i) => {
      if (results[i]) acc[purity] = results[i];
      return acc;
    }, {});
  }

  /**
   * Get current rate for a specific purity
   */
  async getCurrentRateByPurity(purity) {
    const rate = await prisma.goldRate.findFirst({
      where: { purity },
      orderBy: { effectiveFrom: 'desc' },
    });
    if (!rate) throw new NotFoundError(`Gold rate for purity ${purity}`);
    return rate;
  }
}

module.exports = new GoldRateService();
