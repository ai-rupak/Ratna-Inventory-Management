const { prisma } = require('../prisma/client');

/**
 * Base repository class with common CRUD operations
 */
class BaseRepository {
  constructor(modelName) {
    this.model = prisma[modelName];
    this.modelName = modelName;
  }

  /**
   * Find by ID
   */
  async findById(id, options = {}) {
    return this.model.findUnique({
      where: { id },
      ...options,
    });
  }

  /**
   * Find one record
   */
  async findOne(where, options = {}) {
    return this.model.findFirst({
      where,
      ...options,
    });
  }

  /**
   * Find many records
   */
  async findMany(options = {}) {
    return this.model.findMany(options);
  }

  /**
   * Create a record
   */
  async create(data) {
    return this.model.create({ data });
  }

  /**
   * Update a record
   */
  async update(id, data) {
    return this.model.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a record
   */
  async delete(id) {
    return this.model.delete({
      where: { id },
    });
  }

  /**
   * Count records
   */
  async count(where = {}) {
    return this.model.count({ where });
  }

  /**
   * Check if record exists
   */
  async exists(where) {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * Paginate records
   */
  async paginate(page = 1, limit = 20, options = {}) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model.findMany({
        ...options,
        skip,
        take: limit,
      }),
      this.model.count({ where: options.where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Update many records
   */
  async updateMany(where, data) {
    return this.model.updateMany({
      where,
      data,
    });
  }

  /**
   * Delete many records
   */
  async deleteMany(where) {
    return this.model.deleteMany({ where });
  }
}

module.exports = BaseRepository;
