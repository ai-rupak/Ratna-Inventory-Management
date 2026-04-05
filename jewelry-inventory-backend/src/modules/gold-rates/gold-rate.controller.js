const goldRateService = require('./gold-rate.service');
const { successResponse, paginatedResponse } = require('../../common/utils/response.util');

class GoldRateController {
  async setRate(req, res, next) {
    try {
      const rate = await goldRateService.setRate(
        req.body.purity,
        req.body.ratePerGram,
        req.user.id
      );
      successResponse(res, rate, 'Gold rate set successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async getAllRates(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const result = await goldRateService.getAllRates({ purity: req.query.purity }, page, limit);
      paginatedResponse(res, result.data, result.pagination, 'Gold rates retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getCurrentRates(req, res, next) {
    try {
      const rates = await goldRateService.getCurrentRates();
      successResponse(res, rates, 'Current gold rates retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getCurrentRateByPurity(req, res, next) {
    try {
      const rate = await goldRateService.getCurrentRateByPurity(req.params.purity);
      successResponse(res, rate, `Current gold rate for ${req.params.purity} retrieved`);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new GoldRateController();
