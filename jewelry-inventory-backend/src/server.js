// ── Step 1: Load env vars & validate BEFORE anything else ────────────────
require('dotenv').config();
const { validateEnv } = require('./config/env.config');
validateEnv();

// ── Step 2: Normal imports ────────────────────────────────────────────────
const app = require('./app');
const logger = require('./common/utils/logger.util');
const { connectDatabase, prisma } = require('./database/prisma/client');

const PORT = process.env.PORT || 3000;

/**
 * Start background job queue processors (degrade gracefully if Redis is down)
 */
function startQueueProcessors() {
  try {
    const { pdfQueue, emailQueue, reportQueue } = require('./jobs/queues/index');
    const processPdf = require('./jobs/processors/pdf.processor');
    const processEmail = require('./jobs/processors/email.processor');
    const processReport = require('./jobs/processors/report.processor');

    pdfQueue.process(processPdf);
    emailQueue.process(processEmail);
    reportQueue.process(processReport);

    logger.info('Background job processors started (PDF, Email, Report)');
  } catch (err) {
    logger.warn('Queue processors failed to start — Redis may be unavailable:', err.message);
  }
}

async function startServer() {
  try {
    await connectDatabase();
    logger.info('Database connected successfully');

    startQueueProcessors();

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`API Docs: http://localhost:${PORT}/api/docs`);
    });

    // ── Graceful shutdown ─────────────────────────────────────────────────
    const gracefulShutdown = async signal => {
      logger.info(`${signal} received — shutting down gracefully`);

      server.close(async () => {
        logger.info('HTTP server closed');
        try {
          await prisma.$disconnect();
          logger.info('Database disconnected');
        } catch (e) {
          logger.error('Error disconnecting DB:', e.message);
        }
        process.exit(0);
      });

      // Force exit after 15 s if graceful shutdown stalls
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 15000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', error => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
