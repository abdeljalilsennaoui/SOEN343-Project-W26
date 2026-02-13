const Payment = require('../../../src/models/Payment');
const { PaymentStatus } = require('../../../src/models/enums');

describe('Payment Model', () => {
  describe('processPayment', () => {
    it('should process a successful payment', async () => {
      const payment = await Payment.processPayment('res-1', 25.5);

      expect(payment.reservationId).toBe('res-1');
      expect(payment.amount).toBe(25.5);
      expect(payment.status).toBe(PaymentStatus.CONFIRMED);
      expect(payment.paidAt).toBeDefined();
    });

    it('should handle payment failure when simulateFailure is true', async () => {
      const payment = await Payment.processPayment('res-2', 25.5, true);

      expect(payment.reservationId).toBe('res-2');
      expect(payment.amount).toBe(25.5);
      expect(payment.status).toBe(PaymentStatus.FAILED);
      expect(payment.paidAt).toBeNull();
    });
  });

  describe('findByReservationId', () => {
    it('should return payments for a reservation', async () => {
      await Payment.processPayment('res-find-1', 25.5);
      await Payment.processPayment('res-find-1', 10.0);

      const payments = Payment.findByReservationId('res-find-1');
      expect(payments).toHaveLength(2);
    });

    it('should return empty array for unknown reservation', () => {
      const payments = Payment.findByReservationId('unknown-res');
      expect(payments).toEqual([]);
    });
  });
});
