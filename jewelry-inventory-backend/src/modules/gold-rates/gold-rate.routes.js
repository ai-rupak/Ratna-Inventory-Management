const { Router } = require('express');
const controller = require('./gold-rate.controller');
const { authenticate } = require('../../common/middleware/auth.middleware');
const { requireRole } = require('../../common/middleware/rbac.middleware');
const { validate } = require('../../common/middleware/validate.middleware');
const { setRateValidator, listRatesValidator, purityParamValidator } = require('./gold-rate.validators');

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Gold Rates
 *   description: Live gold rate management per purity
 */

/**
 * @swagger
 * /gold-rates:
 *   post:
 *     summary: Set a new gold rate
 *     tags: [Gold Rates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SetGoldRateRequest'
 *     responses:
 *       201:
 *         description: Gold rate set successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  requireRole('SUPER_ADMIN'),
  setRateValidator,
  validate,
  controller.setRate
);

/**
 * @swagger
 * /gold-rates:
 *   get:
 *     summary: List gold rate history
 *     tags: [Gold Rates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: purity
 *         schema:
 *           type: string
 *           enum: [24K, 22K, 18K, 14K]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated list of gold rate history
 */
router.get(
  '/',
  listRatesValidator,
  validate,
  controller.getAllRates
);

/**
 * @swagger
 * /gold-rates/current:
 *   get:
 *     summary: Get current rates for all purities
 *     tags: [Gold Rates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current rates keyed by purity
 */
router.get('/current', controller.getCurrentRates);

/**
 * @swagger
 * /gold-rates/current/{purity}:
 *   get:
 *     summary: Get current rate for a specific purity
 *     tags: [Gold Rates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purity
 *         required: true
 *         schema:
 *           type: string
 *           enum: [24K, 22K, 18K, 14K]
 *     responses:
 *       200:
 *         description: Current gold rate for the purity
 *       404:
 *         description: No rate set for this purity
 */
router.get(
  '/current/:purity',
  purityParamValidator,
  validate,
  controller.getCurrentRateByPurity
);

module.exports = router;
