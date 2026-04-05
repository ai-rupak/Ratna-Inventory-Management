const { body, query, param } = require('express-validator');

const setRateValidator = [
  body('purity')
    .isIn(['24K', '22K', '18K', '14K'])
    .withMessage('purity must be 24K, 22K, 18K, or 14K'),
  body('ratePerGram')
    .isFloat({ gt: 0 })
    .withMessage('ratePerGram must be a positive number'),
];

const listRatesValidator = [
  query('purity').optional().isIn(['24K', '22K', '18K', '14K']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

const purityParamValidator = [
  param('purity')
    .isIn(['24K', '22K', '18K', '14K'])
    .withMessage('purity must be 24K, 22K, 18K, or 14K'),
];

module.exports = { setRateValidator, listRatesValidator, purityParamValidator };
