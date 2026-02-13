/**
 * Payment Gateway Interface
 * Defines the contract for payment processing services.
 * Implement this interface to integrate a real payment provider.
 *
 * @interface IPaymentGateway
 * @method charge(amount, metadata) - Process a payment charge
 * @method refund(transactionId) - Refund a previous charge
 */
class IPaymentGateway {
  async charge(_amount, _metadata) {
    throw new Error('IPaymentGateway.charge() must be implemented');
  }

  async refund(_transactionId) {
    throw new Error('IPaymentGateway.refund() must be implemented');
  }
}

module.exports = IPaymentGateway;
