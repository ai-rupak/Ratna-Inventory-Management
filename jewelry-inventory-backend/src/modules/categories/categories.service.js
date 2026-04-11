const { prisma } = require('../../database/prisma/client');
const { NotFoundError, ValidationError } = require('../../common/constants/errors');

class CategoryService {
  async createCategory(data) {
    const existing = await prisma.category.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw new ValidationError('A category with this name already exists');
    }
    return prisma.category.create({ data });
  }

  async getAllCategories(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    return prisma.category.findMany({ where, orderBy: { name: 'asc' } });
  }

  async getCategoryById(id) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundError('Category');
    return category;
  }

  async updateCategory(id, data) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundError('Category');
    
    if (data.name && data.name !== category.name) {
      const existing = await prisma.category.findUnique({ where: { name: data.name } });
      if (existing) {
        throw new ValidationError('A category with this name already exists');
      }
    }

    return prisma.category.update({
      where: { id },
      data,
    });
  }

  async deleteCategory(id) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundError('Category');

    return prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

module.exports = new CategoryService();
