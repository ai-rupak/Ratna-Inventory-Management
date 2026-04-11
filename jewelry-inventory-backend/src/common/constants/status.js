const STATUS = {
  // Invoice Status
  INVOICE: {
    DRAFT: 'DRAFT',
    COMPLETED: 'COMPLETED',
    PARTIALLY_RETURNED: 'PARTIALLY_RETURNED',
    FULLY_RETURNED: 'FULLY_RETURNED',
    CANCELLED: 'CANCELLED',
  },

  // Refund Status
  REFUND: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    COMPLETED: 'COMPLETED',
  },

  // Payment Methods
  PAYMENT: {
    CASH: 'CASH',
    CARD: 'CARD',
    UPI: 'UPI',
    MIXED: 'MIXED',
  },

  // Ledger Types
  LEDGER: {
    ALLOCATION: 'ALLOCATION',
    SALE: 'SALE',
    REFUND: 'REFUND',
    ADJUSTMENT: 'ADJUSTMENT',
  },

  // Weight unit types
  WEIGHT_UNIT: {
    RATI: 'RATI',
    CARAT: 'CARAT',
  },
};

module.exports = STATUS;
