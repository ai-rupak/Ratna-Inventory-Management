const Bull = require('bull');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: 100, // keep last 100 completed jobs
  removeOnFail: 50,      // keep last 50 failed jobs
};

const pdfQueue = new Bull('pdf-generation', { redis: redisConfig, defaultJobOptions });
const emailQueue = new Bull('email-notifications', { redis: redisConfig, defaultJobOptions });
const reportQueue = new Bull('report-generation', { redis: redisConfig, defaultJobOptions });

// Log queue events
[pdfQueue, emailQueue, reportQueue].forEach(queue => {
  queue.on('error', err => {
    const logger = require('../../common/utils/logger.util');
    logger.error(`Queue [${queue.name}] error:`, err);
  });
  queue.on('failed', (job, err) => {
    const logger = require('../../common/utils/logger.util');
    logger.warn(`Queue [${queue.name}] job ${job.id} failed: ${err.message}`);
  });
});

module.exports = { pdfQueue, emailQueue, reportQueue };
