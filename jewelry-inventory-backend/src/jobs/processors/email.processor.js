const logger = require('../../common/utils/logger.util');
const { getTransporter, EMAIL_FROM } = require('../../config/email.config');

/**
 * Email templates
 */
const templates = {
  INVOICE_CREATED: ({ invoiceNumber, customerName, totalAmount, storeName }) => ({
    subject: `Invoice ${invoiceNumber} — ₹${Number(totalAmount).toLocaleString('en-IN')}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#7c3aed">Ratna Jewelry</h2>
        <p>Dear ${customerName || 'Valued Customer'},</p>
        <p>Thank you for your purchase at <strong>${storeName || 'our store'}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr style="background:#f3f4f6">
            <td style="padding:10px;font-weight:bold">Invoice Number</td>
            <td style="padding:10px">${invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding:10px;font-weight:bold">Total Amount</td>
            <td style="padding:10px">₹${Number(totalAmount).toLocaleString('en-IN')}</td>
          </tr>
        </table>
        <p style="color:#6b7280;font-size:12px">
          This is an automated email. Please retain this as your purchase record.
        </p>
      </div>
    `,
  }),

  REFUND_APPROVED: ({ refundNumber, customerName, refundAmount }) => ({
    subject: `Refund Approved — ${refundNumber}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#7c3aed">Ratna Jewelry</h2>
        <p>Dear ${customerName || 'Valued Customer'},</p>
        <p>Your refund request has been <strong style="color:#059669">approved</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr style="background:#f3f4f6">
            <td style="padding:10px;font-weight:bold">Refund Number</td>
            <td style="padding:10px">${refundNumber}</td>
          </tr>
          <tr>
            <td style="padding:10px;font-weight:bold">Refund Amount</td>
            <td style="padding:10px">₹${Number(refundAmount).toLocaleString('en-IN')}</td>
          </tr>
        </table>
        <p style="color:#6b7280;font-size:12px">
          The refund will be processed within 3–5 business days.
        </p>
      </div>
    `,
  }),

  REFUND_REJECTED: ({ refundNumber, customerName, reason }) => ({
    subject: `Refund Update — ${refundNumber}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#7c3aed">Ratna Jewelry</h2>
        <p>Dear ${customerName || 'Valued Customer'},</p>
        <p>We regret to inform you that your refund request <strong>${refundNumber}</strong>
           has been <strong style="color:#dc2626">rejected</strong>.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>Please visit your nearest store for further assistance.</p>
      </div>
    `,
  }),
};

/**
 * Email Processor — sends real emails via SMTP using nodemailer
 */
const processEmailJob = async job => {
  const { event, payload } = job.data;
  logger.info(`[Email] Processing event: ${event}`, { payload });

  const customerEmail = payload.customerEmail;
  if (!customerEmail) {
    logger.info(`[Email] Skipped — no customer email for event ${event}`);
    return { event, status: 'skipped', reason: 'no_email' };
  }

  const template = templates[event];
  if (!template) {
    logger.warn(`[Email] Unknown event type: ${event}`);
    return { event, status: 'skipped', reason: 'unknown_event' };
  }

  const { subject, html } = template(payload);

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: customerEmail,
      subject,
      html,
    });

    logger.info(`[Email] Sent — ${event} to ${customerEmail}`, { messageId: info.messageId });
    return { event, status: 'sent', messageId: info.messageId };
  } catch (err) {
    logger.error(`[Email] Failed to send ${event} to ${customerEmail}:`, err.message);
    throw err; // Bull will retry based on job options
  }
};

module.exports = processEmailJob;
