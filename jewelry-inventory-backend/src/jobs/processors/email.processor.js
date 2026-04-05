const logger = require('../../common/utils/logger.util');

/**
 * Email Processor — sends transactional email notifications
 *
 * Supported event types:
 * - INVOICE_CREATED   { invoiceNumber, customerName, customerEmail, totalAmount }
 * - REFUND_APPROVED   { refundNumber, customerName, customerEmail, refundAmount }
 * - REFUND_REJECTED   { refundNumber, customerName, customerEmail }
 *
 * Phase 3: placeholder — logs the email event.
 * Phase 4 will integrate Nodemailer / SendGrid.
 */
const processEmailJob = async job => {
  const { event, payload } = job.data;
  logger.info(`[Email] Processing event: ${event}`, { payload });

  switch (event) {
    case 'INVOICE_CREATED':
      logger.info(
        `[Email] Would send invoice confirmation to ${payload.customerEmail || 'no email'} — ${payload.invoiceNumber} — ₹${payload.totalAmount}`
      );
      break;
    case 'REFUND_APPROVED':
      logger.info(
        `[Email] Would send refund confirmation to ${payload.customerEmail || 'no email'} — ${payload.refundNumber} — ₹${payload.refundAmount}`
      );
      break;
    case 'REFUND_REJECTED':
      logger.info(
        `[Email] Would send refund rejection to ${payload.customerEmail || 'no email'} — ${payload.refundNumber}`
      );
      break;
    default:
      logger.warn(`[Email] Unknown event type: ${event}`);
  }

  return { event, status: 'queued' };
};

module.exports = processEmailJob;
