jest.mock('../../../src/lib/firestore');

const db = require('../../../src/lib/firestore');
const Payment = require('../../../src/models/Payment');
const { PaymentStatus } = require('../../../src/models/enums');

beforeEach(() => { db._reset(); });

describe('Payment.processPayment()', () => {
  it('processes a successful payment', async () => {
    const payment = await Payment.processPayment('res-1', 25.5);

    expect(payment.reservationId).toBe('res-1');
    expect(payment.amount).toBe(25.5);
    expect(payment.status).toBe(PaymentStatus.CONFIRMED);
    expect(payment.paidAt).toBeDefined();
  });

  it('records a failed payment when simulateFailure is true', async () => {
    const payment = await Payment.processPayment('res-2', 25.5, true);

    expect(payment.reservationId).toBe('res-2');
    expect(payment.amount).toBe(25.5);
    expect(payment.status).toBe(PaymentStatus.FAILED);
    expect(payment.paidAt).toBeNull();
  });
});

describe('Payment.findByReservationId()', () => {
  it('returns all payments for a reservation', async () => {
    await Payment.processPayment('res-find-1', 25.5);
    await Payment.processPayment('res-find-1', 10.0);

    const payments = await Payment.findByReservationId('res-find-1');
    expect(payments).toHaveLength(2);
  });

  it('returns empty array for unknown reservation', async () => {
    const payments = await Payment.findByReservationId('unknown-res');
    expect(payments).toEqual([]);
  });
});
