const { randomUUID } = require('crypto');

/**
 * Correlation ID Middleware
 *
 * Reads X-Request-ID from incoming headers (set by API gateway / client)
 * or generates a new UUID. Attaches to req.correlationId and echoes it
 * back in the response header — enables end-to-end request tracing.
 */
const correlationMiddleware = (req, res, next) => {
  // Use incoming ID if present, otherwise generate one
  const correlationId = req.headers['x-request-id'] || randomUUID();

  req.correlationId = correlationId;

  // Echo back on every response
  res.setHeader('X-Request-ID', correlationId);

  next();
};

module.exports = correlationMiddleware;
