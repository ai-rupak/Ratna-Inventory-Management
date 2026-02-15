const { prisma } = require('../prisma/client');
const logger = require('../../common/utils/logger.util');

/**
 * Transaction service for managing database transactions
 */
class TransactionService {
  /**
   * Execute operations within a transaction
   * @param {Function} operation - Async function that receives transaction client
   * @param {Object} options - Transaction options
   * @returns {Promise<*>}
   */
  async runInTransaction(operation, options = {}) {
    const defaultOptions = {
      maxWait: 5000,
      timeout: 10000,
      isolationLevel: 'Serializable',
    };

    return prisma.$transaction(
      async tx => {
        try {
          return await operation(tx);
        } catch (error) {
          logger.error('Transaction error:', error);
          throw error;
        }
      },
      { ...defaultOptions, ...options }
    );
  }

  /**
   * Execute operation with retry logic
   * @param {Function} operation - Async function to execute
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {Promise<*>}
   */
  async runWithRetry(operation, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Check if error is retriable
        if (this.isRetriableError(error) && attempt < maxRetries) {
          const delay = 2 ** attempt * 100; // Exponential backoff
          logger.warn(`Transaction attempt ${attempt} failed, retrying in ${delay}ms...`);
          await this.delay(delay);
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Check if error is retriable
   * @param {Error} error
   * @returns {boolean}
   */
  isRetriableError(error) {
    const retriableCodes = [
      'WriteConflict',
      'TransientTransactionError',
      'UnknownTransactionCommitResult',
    ];

    return retriableCodes.some(code => error.message?.includes(code) || error.code === code);
  }

  /**
   * Delay helper
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }
}

module.exports = new TransactionService();
