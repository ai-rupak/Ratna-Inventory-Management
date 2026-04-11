const path = require('path');
const fs = require('fs');
const logger = require('../../common/utils/logger.util');
const { prisma } = require('../../database/prisma/client');

// Ensure invoices directory exists
const INVOICES_DIR = path.join(process.cwd(), 'invoices');
if (!fs.existsSync(INVOICES_DIR)) {
  fs.mkdirSync(INVOICES_DIR, { recursive: true });
}

/**
 * Draw a horizontal rule line
 */
function drawHRule(doc, y) {
  doc.moveTo(50, y).lineTo(545, y).lineWidth(0.5).strokeColor('#d1d5db').stroke();
}

/**
 * PDF Invoice Processor — generates a formatted PDF using pdfkit
 *
 * Job data: { invoiceId, invoiceNumber, storeId, totalAmount }
 */
const processPdfJob = async job => {
  const { invoiceId, invoiceNumber } = job.data;
  logger.info(`[PDF] Generating invoice PDF — ${invoiceNumber}`);

  // Load full invoice from DB
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      items: true,
      customer: true,
      store: true,
    },
  });

  if (!invoice) {
    logger.warn(`[PDF] Invoice not found: ${invoiceId}`);
    return { status: 'skipped', reason: 'invoice_not_found' };
  }

  let PDFDocument;
  try {
    PDFDocument = require('pdfkit');
  } catch {
    logger.warn('[PDF] pdfkit not installed — run: npm install pdfkit');
    return { status: 'skipped', reason: 'pdfkit_not_installed' };
  }

  const outputPath = path.join(INVOICES_DIR, `${invoiceNumber}.pdf`);
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  await new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);
    stream.on('finish', resolve);
    stream.on('error', reject);

    // ── Header ───────────────────────────────────────────────────────────
    doc.fontSize(22).fillColor('#7c3aed').text('RATNA JEWELRY', 50, 50);
    doc.fontSize(10).fillColor('#6b7280')
      .text(invoice.store?.name || '', 50, 78)
      .text(invoice.store?.address || '', 50, 92)
      .text(`Phone: ${invoice.store?.phone || ''}`, 50, 106);

    doc.fontSize(18).fillColor('#111827').text('TAX INVOICE', 400, 50, { align: 'right' });
    doc.fontSize(10).fillColor('#374151')
      .text(`Invoice #: ${invoice.invoiceNumber}`, 400, 78, { align: 'right' })
      .text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, 400, 92, { align: 'right' })
      .text(`Payment: ${invoice.paymentMethod}`, 400, 106, { align: 'right' });

    drawHRule(doc, 130);

    // ── Customer ─────────────────────────────────────────────────────────
    doc.fontSize(10).fillColor('#374151')
      .text('BILL TO:', 50, 145, { underline: true })
      .text(invoice.customer?.name || 'Walk-in Customer', 50, 162)
      .text(invoice.customer?.phone || '', 50, 177)
      .text(invoice.customer?.email || '', 50, 192);

    drawHRule(doc, 215);

    // ── Items table header ────────────────────────────────────────────────
    let y = 230;
    doc.fontSize(9).fillColor('#6b7280')
      .text('ITEM', 50, y)
      .text('SKU', 185, y)
      .text('WT (RATI/CARAT)', 280, y)
      .text('STONES', 365, y)
      .text('RATE/UNIT', 415, y)
      .text('GST', 470, y)
      .text('TOTAL', 515, y);

    drawHRule(doc, y + 14);
    y += 22;

    // ── Items ─────────────────────────────────────────────────────────────
    doc.fontSize(9).fillColor('#111827');
    for (const item of invoice.items) {
      doc
        .text(item.productName.substring(0, 22), 50, y)
        .text(item.sku, 185, y)
        .text(item.weight.toFixed(4), 280, y)
        .text(`${item.stoneCount}`, 365, y)
        .text(`₹${item.pricePerUnit.toFixed(2)}`, 415, y)
        .text(`₹${item.gstAmount.toFixed(2)}`, 470, y)
        .text(`₹${item.totalAmount.toFixed(2)}`, 515, y);

      // RFID tag
      doc.fontSize(7).fillColor('#9ca3af').text(`RFID: ${item.rfid}`, 50, y + 12);
      doc.fontSize(9).fillColor('#111827');

      y += 28;
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    }

    drawHRule(doc, y + 5);
    y += 20;

    // ── Totals ────────────────────────────────────────────────────────────
    doc.fontSize(10).fillColor('#374151')
      .text('Subtotal:', 400, y)
      .text(`₹${invoice.subtotal.toFixed(2)}`, 505, y);
    y += 18;
    doc.text('GST:', 400, y)
      .text(`₹${invoice.gstAmount.toFixed(2)}`, 505, y);
    y += 18;
    doc.fontSize(12).fillColor('#7c3aed')
      .text('TOTAL:', 400, y, { bold: true })
      .text(`₹${invoice.totalAmount.toFixed(2)}`, 505, y);

    drawHRule(doc, y + 20);

    // ── Footer ────────────────────────────────────────────────────────────
    doc.fontSize(8).fillColor('#9ca3af')
      .text('Thank you for shopping with Ratna Jewelry. This is a computer-generated invoice.',
        50, y + 35, { align: 'center', width: 495 });

    doc.end();
  });

  logger.info(`[PDF] Invoice saved — ${outputPath}`);
  return { invoiceId, invoiceNumber, pdfPath: outputPath, status: 'done' };
};

module.exports = processPdfJob;
