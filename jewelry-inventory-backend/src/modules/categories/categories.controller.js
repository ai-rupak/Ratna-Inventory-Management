const categoryService = require('./categories.service');
const { successResponse } = require('../../common/utils/response.util');

class CategoryController {
  async createCategory(req, res, next) {
    try {
      const category = await categoryService.createCategory(req.body);
      successResponse(res, category, 'Category created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getAllCategories(req, res, next) {
    try {
      const { includeInactive } = req.query;
      const categories = await categoryService.getAllCategories(includeInactive === 'true');
      successResponse(res, categories);
    } catch (error) {
      next(error);
    }
  }

  async getCategoryById(req, res, next) {
    try {
      const category = await categoryService.getCategoryById(req.params.id);
      successResponse(res, category);
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const category = await categoryService.updateCategory(req.params.id, req.body);
      successResponse(res, category, 'Category updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      const category = await categoryService.deleteCategory(req.params.id);
      successResponse(res, category, 'Category deactivated successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CategoryController();
