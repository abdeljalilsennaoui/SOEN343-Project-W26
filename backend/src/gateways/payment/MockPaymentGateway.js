const { v4: uuidv4 } = require('uuid');
const IPaymentGateway = require('./IPaymentGateway');

class MockPaymentGateway extends IPaymentGateway {
  async charge(amount, metadata = {}) {
    const transactionId = uuidv4();

    if (metadata.simulateFailure) {
      return {
        transactionId,
        success: false,
        message: 'Payment declined (simulated failure)',
      };
    }

    return {
      transactionId,
      success: true,
      message: `Successfully charged $${amount.toFixed(2)}`,
    };
  }

  async refund(transactionId) {
    return {
      transactionId,
      success: true,
      message: `Refund processed for transaction ${transactionId}`,
    };
  }
}

module.exports = MockPaymentGateway;
