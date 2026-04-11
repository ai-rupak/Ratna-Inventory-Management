'use strict';

/**
 * Email / SMTP Configuration
 *
 * Supports any SMTP provider (Gmail, SendGrid SMTP, Mailtrap, etc.)
 * Set SMTP_ENABLED=false to disable all email sending (development default).
 */

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  // Lazily require nodemailer so the app doesn't crash if it isn't installed
  let nodemailer;
  try {
    nodemailer = require('nodemailer');
  } catch {
    throw new Error('nodemailer is not installed. Run: npm install nodemailer');
  }

  const smtpEnabled = process.env.SMTP_ENABLED !== 'false';

  if (!smtpEnabled) {
    // Use Ethereal (fake SMTP) in development when SMTP is not configured
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

const EMAIL_FROM = process.env.EMAIL_FROM || 'Ratna Jewelry <noreply@ratnajewelry.com>';

module.exports = { getTransporter, EMAIL_FROM };
