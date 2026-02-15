const { validationResult } = require('express-validator');
const { ValidationError } = require('../constants/errors');

/**
 * Validation middleware - Check express-validator results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    return next(new ValidationError('Validation failed', errorDetails));
  }

  next();
};

module.exports = {
  validate,
};
