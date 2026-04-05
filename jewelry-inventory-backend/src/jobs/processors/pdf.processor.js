const logger = require('../../common/utils/logger.util');

/**
 * PDF Processor — generates invoice PDFs
 *
 * Job data shape:
 * {
 *   invoiceId: string,
 *   invoiceNumber: string,
 *   storeId: string,
 *   totalAmount: number,
 * }
 *
 * Phase 3: placeholder implementation — logs the job data.
 * Phase 4 will integrate a PDF library (e.g. puppeteer or pdfkit).
 */
const processPdfJob = async job => {
  const { invoiceId, invoiceNumber } = job.data;
  logger.info(`[PDF] Processing invoice PDF — ${invoiceNumber} (${invoiceId})`);

  // TODO Phase 4: Generate PDF from invoice data and upload to object storage
  // const pdf = await renderInvoicePdf(invoiceId);
  // const url = await uploadToS3(pdf, `invoices/${invoiceNumber}.pdf`);
  // await prisma.invoice.update({ where: { id: invoiceId }, data: { pdfUrl: url } });

  logger.info(`[PDF] Invoice PDF job completed — ${invoiceNumber}`);
  return { invoiceId, invoiceNumber, status: 'queued' };
};

module.exports = processPdfJob;
