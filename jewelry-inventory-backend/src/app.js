const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger.config');
const { errorHandler, notFoundHandler } = require('./common/middleware/error.middleware');
const correlationMiddleware = require('./common/middleware/correlation.middleware');
const { standardRateLimiter, strictRateLimiter } = require('./common/middleware/rate-limit.middleware');
const logger = require('./common/utils/logger.util');
const healthService = require('./modules/health/health.service');

const app = express();
const apiPrefix = process.env.API_PREFIX || '/api/v1';

// ── 1. Correlation IDs (first — so every log has a request ID) ─────────────
app.use(correlationMiddleware);

// ── 2. Security headers ────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

// ── 3. Body parsing ────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── 4. Request / response logging with timing ──────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${res.statusCode} — ${ms}ms`, {
      correlationId: req.correlationId,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });
  next();
});

// ── 5. Health check (no rate limit, no auth) ───────────────────────────────
/**
 * @swagger
 * /health:
 *   get:
 *     summary: System health check
 *     tags: [Health]
 *     security: []
 *     servers:
 *       - url: /
 *     responses:
 *       200:
 *         description: System is healthy
 *       503:
 *         description: System is degraded
 */
app.get('/health', async (req, res) => {
  const health = await healthService.check();
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json({ ...health, requestId: req.correlationId });
});

// ── 6. Swagger docs ────────────────────────────────────────────────────────
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Ratna Jewelry API Docs',
    swaggerOptions: { persistAuthorization: true },
  })
);
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ── 7. Global API rate limiter ─────────────────────────────────────────────
app.use(apiPrefix, standardRateLimiter);

// ── 8. Routes — Phase 1 ───────────────────────────────────────────────────
const authRoutes = require('./modules/auth/auth.routes');
app.use(`${apiPrefix}/auth`, authRoutes);         // strict limiter applied inside

const userRoutes = require('./modules/users/users.routes');
app.use(`${apiPrefix}/users`, userRoutes);

const storeRoutes = require('./modules/stores/stores.routes');
app.use(`${apiPrefix}/stores`, storeRoutes);

const productRoutes = require('./modules/products/products.routes');
app.use(`${apiPrefix}/products`, productRoutes);

const categoryRoutes = require('./modules/categories/categories.routes');
app.use(`${apiPrefix}/categories`, categoryRoutes);

// ── 9. Routes — Phase 2 ────────────────────────────────────────────────────
const inventoryRoutes = require('./modules/inventory/inventory.routes');
app.use(`${apiPrefix}/inventory`, inventoryRoutes);

const billingRoutes = require('./modules/billing/billing.routes');
app.use(`${apiPrefix}/billing`, billingRoutes);

const refundRoutes = require('./modules/refunds/refunds.routes');
app.use(`${apiPrefix}/refunds`, refundRoutes);

const auditRoutes = require('./modules/audit/audit.routes');
app.use(`${apiPrefix}/audit`, auditRoutes);

// ── 10. Routes — Phase 3 ───────────────────────────────────────────────────
// (Gold rates removed)

// ── 11. Error handlers (must be last) ─────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
