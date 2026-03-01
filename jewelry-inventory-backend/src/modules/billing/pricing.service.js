/**
 * Pricing Service — computes item prices from product + gold rate
 */
class PricingService {
  /**
   * Calculate price breakdown for a single invoice item
   *
   * @param {Object} product     - Prisma Product record
   * @param {number} actualWeight  - actual weighed weight in grams
   * @param {number} stoneWeight   - stone weight in grams (deducted for gold calc)
   * @param {number} stoneCount
   * @param {number} goldRatePerGram - live gold rate (passed by caller)
   * @returns {Object} price breakdown
   */
  calculateItemPrice(product, actualWeight, stoneWeight = 0, stoneCount = 0, goldRatePerGram) {
    const netGoldWeight = actualWeight - stoneWeight;

    // Gold price
    const goldPrice = netGoldWeight * goldRatePerGram;

    // Making charge
    let makingCharge;
    switch (product.makingChargeType) {
      case 'PER_GRAM':
        makingCharge = netGoldWeight * product.makingCharge;
        break;
      case 'PERCENTAGE':
        makingCharge = (goldPrice * product.makingCharge) / 100;
        break;
      case 'FIXED':
      default:
        makingCharge = product.makingCharge;
        break;
    }

    // GST is applied on goldPrice + makingCharge
    const taxableAmount = goldPrice + makingCharge;
    const gstAmount = (taxableAmount * product.gstRate) / 100;
    const totalAmount = taxableAmount + gstAmount;

    return {
      netGoldWeight: parseFloat(netGoldWeight.toFixed(3)),
      ratePerGram: goldRatePerGram,
      goldPrice: parseFloat(goldPrice.toFixed(2)),
      makingCharge: parseFloat(makingCharge.toFixed(2)),
      gstRate: product.gstRate,
      gstAmount: parseFloat(gstAmount.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
    };
  }

  /**
   * Compute refund amount for a returned item
   * Refund = (net gold weight returned × original gold rate) + making charge − GST reversal
   * Implementation: use original invoice snapshot prices
   */
  calculateRefundAmount(invoiceItem, returnedWeight) {
    const proportion = returnedWeight / invoiceItem.actualWeight;
    const refundGoldPrice = parseFloat((invoiceItem.goldPrice * proportion).toFixed(2));
    const refundMakingCharge = parseFloat((invoiceItem.makingCharge * proportion).toFixed(2));
    const refundGst = parseFloat((invoiceItem.gstAmount * proportion).toFixed(2));
    return parseFloat((refundGoldPrice + refundMakingCharge + refundGst).toFixed(2));
  }
}

module.exports = new PricingService();
