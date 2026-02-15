const { PrismaClient } = require('@prisma/client');
const logger = require('../../common/utils/logger.util');

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', e => {
    logger.debug('Query:', e.query);
    logger.debug('Duration:', `${e.duration}ms`);
  });
}

prisma.$on('error', e => {
  logger.error('Prisma error:', e);
});

async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('Prisma connected to MongoDB');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
}

async function disconnectDatabase() {
  await prisma.$disconnect();
  logger.info('Prisma disconnected from MongoDB');
}

module.exports = {
  prisma,
  connectDatabase,
  disconnectDatabase,
};
