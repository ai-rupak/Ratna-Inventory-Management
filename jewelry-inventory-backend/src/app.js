const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger.config');
const { errorHandler, notFoundHandler } = require('./common/middleware/error.middleware');
const logger = require('./common/utils/logger.util');
const healthService = require('./modules/health/health.service');

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// ── Health check ───────────────────────────────────────────────────────────
/**
 * @swagger
 * /health:
 *   get:
 *     summary: System health check
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: System health status
 */
app.get('/health', async (req, res) => {
  const health = await healthService.check();
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// ── Swagger docs ───────────────────────────────────────────────────────────
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Ratna Jewelry API Docs',
    swaggerOptions: { persistAuthorization: true },
  })
);

// Raw OpenAPI JSON (for tooling)
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ── API Routes ─────────────────────────────────────────────────────────────
const apiPrefix = process.env.API_PREFIX || '/api/v1';

// Phase 1 routes
const authRoutes = require('./modules/auth/auth.routes');
app.use(`${apiPrefix}/auth`, authRoutes);

const userRoutes = require('./modules/users/users.routes');
app.use(`${apiPrefix}/users`, userRoutes);

const storeRoutes = require('./modules/stores/stores.routes');
app.use(`${apiPrefix}/stores`, storeRoutes);

const productRoutes = require('./modules/products/products.routes');
app.use(`${apiPrefix}/products`, productRoutes);

// Phase 2 routes
const inventoryRoutes = require('./modules/inventory/inventory.routes');
app.use(`${apiPrefix}/inventory`, inventoryRoutes);

const billingRoutes = require('./modules/billing/billing.routes');
app.use(`${apiPrefix}/billing`, billingRoutes);

const refundRoutes = require('./modules/refunds/refunds.routes');
app.use(`${apiPrefix}/refunds`, refundRoutes);

const auditRoutes = require('./modules/audit/audit.routes');
app.use(`${apiPrefix}/audit`, auditRoutes);

// Phase 3 routes
const goldRateRoutes = require('./modules/gold-rates/gold-rate.routes');
app.use(`${apiPrefix}/gold-rates`, goldRateRoutes);

// ── Error handlers ─────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
