const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { errorHandler, notFoundHandler } = require('./common/middleware/error.middleware');
const logger = require('./common/utils/logger.util');

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

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes - will be added as modules are created
const apiPrefix = process.env.API_PREFIX || '/api/v1';

// Auth routes
const authRoutes = require('./modules/auth/auth.routes');
app.use(`${apiPrefix}/auth`, authRoutes);

// User routes
const userRoutes = require('./modules/users/users.routes');
app.use(`${apiPrefix}/users`, userRoutes);

// Store routes
const storeRoutes = require('./modules/stores/stores.routes');
app.use(`${apiPrefix}/stores`, storeRoutes);

// Product routes
const productRoutes = require('./modules/products/products.routes');
app.use(`${apiPrefix}/products`, productRoutes);

// Inventory routes (Phase 2)
const inventoryRoutes = require('./modules/inventory/inventory.routes');
app.use(`${apiPrefix}/inventory`, inventoryRoutes);

// Billing routes (Phase 2)
const billingRoutes = require('./modules/billing/billing.routes');
app.use(`${apiPrefix}/billing`, billingRoutes);

// Refund routes (Phase 2)
const refundRoutes = require('./modules/refunds/refunds.routes');
app.use(`${apiPrefix}/refunds`, refundRoutes);

// Audit & Reporting routes (Phase 2)
const auditRoutes = require('./modules/audit/audit.routes');
app.use(`${apiPrefix}/audit`, auditRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
