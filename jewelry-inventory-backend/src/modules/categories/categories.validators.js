const { body, param } = require('express-validator');

const createCategoryValidation = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('description').optional().trim(),
];

const updateCategoryValidation = [
  param('id').isMongoId().withMessage('Invalid category ID'),
  body('name').optional().trim().notEmpty().withMessage('Category name cannot be empty'),
  body('description').optional().trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

const categoryIdValidation = [
  param('id').isMongoId().withMessage('Invalid category ID')
];

module.exports = {
  createCategoryValidation,
  updateCategoryValidation,
  categoryIdValidation,
};
