/**
 * Pricing Service — computes item prices based on stone weight (RATI/CARAT) × pricePerUnit
 */
class PricingService {
  /**
   * Calculate price breakdown for a single invoice item
   *
   * @param {Object} product       - Prisma Product record (must include weightUnit, pricePerUnit, gstRate)
   * @param {number} weight        - weight sold in RATI or CARAT (as per product.weightUnit)
   * @param {number} stoneCount    - number of stones (recorded, not charged separately)
   * @returns {Object} price breakdown
   */
  calculateItemPrice(product, weight, stoneCount = 0) {
    // Base price = weight × price per unit (RATI or CARAT)
    const baseAmount = weight * product.pricePerUnit;

    // GST applied on base amount
    const gstAmount = (baseAmount * product.gstRate) / 100;
    const totalAmount = baseAmount + gstAmount;

    return {
      weight: parseFloat(weight.toFixed(4)),
      pricePerUnit: product.pricePerUnit,
      baseAmount: parseFloat(baseAmount.toFixed(2)),
      gstRate: product.gstRate,
      gstAmount: parseFloat(gstAmount.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
    };
  }

  /**
   * Compute refund amount for a returned item
   * Uses original invoice item price snapshot, proportionate to returned weight
   *
   * @param {Object} invoiceItem  - Prisma InvoiceItem record
   * @param {number} returnedWeight - weight being returned in RATI/CARAT
   */
  calculateRefundAmount(invoiceItem, returnedWeight) {
    const proportion = returnedWeight / invoiceItem.weight;
    const refundBaseAmount = parseFloat((invoiceItem.totalAmount * proportion).toFixed(2));
    return refundBaseAmount;
  }
}

module.exports = new PricingService();
